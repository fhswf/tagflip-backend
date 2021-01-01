import * as streamBuffers from "stream-buffers";
import * as tmp from "tmp";
import * as unzipper from "unzipper";
import * as recursive from "recursive-readdir";
import * as _ from "lodash";
import * as fs from "fs";
import * as path from "path";
import * as rimraf from "rimraf";
import { AnnotationAttributes, TagAttributes } from "@fhswf/tagflip-common";
import { Corpus } from "../../../persistence/model/Corpus";
import { Document } from "../../../persistence/model/Document";
import * as chroma from "chroma-js";
import { Tag } from "../../../persistence/model/Tag";
import { Inject } from "typescript-ioc";
import { CorpusRepository } from "../../../persistence/dao/CorpusRepository";
import { DocumentRepository } from "../../../persistence/dao/DocumentRepository";
import { TagRepository } from "../../../persistence/dao/TagRepository";
import { AnnotationRepository } from "../../../persistence/dao/AnnotationRepository";
import { AnnotationSetRepository } from "../../../persistence/dao/AnnotationSetRepository";
import { AnnotationSet } from "../../../persistence/model/AnnotationSet";
import { Annotation } from "../../../persistence/model/Annotation";
import Hashing from "../../../util/Hashing";
import { NotFoundError } from "typescript-rest/dist/server/model/errors";

/**
 * Declares a type being an importer for an annotated Corpus.
 * @param name the name of the importer.
 * @constructor the constructor of the type.
 */
export const Importer = <_T extends AbstractImporter>(name: string) => {
    console.log("Discovered Importer with name:", name);
    return <T extends new (...args: any[]) => AbstractImporter>(constructor: T) => {
        AbstractImporter.register(name, new constructor())
    }
}

export interface ImportAnnotation {
    name: string,
    color?: string
}

export interface ImportTag {
    annotation: ImportAnnotation
    fromIndex: number,
    toIndex: number
}

export interface ImportDocument {
    content: string,
    fileName: string,
    tags: ImportTag[]
}

/**
 * This class defines an abstract definition of an importer that is able to import an annotated corpus.
 */
export default abstract class AbstractImporter {

    /**
     * The known importers
     * @private
     */
    private static importers: Map<string, AbstractImporter> = new Map<string, AbstractImporter>()

    @Inject
    private corpusRepository!: CorpusRepository

    @Inject
    private documentRepository!: DocumentRepository

    @Inject
    private tagRepository!: TagRepository

    @Inject
    private annotationRepository!: AnnotationRepository

    @Inject
    private annotationSetRepository!: AnnotationSetRepository

    /**
     * Returns a list of known importers.
     * @return a list of known importers
     */
    public static getImporterNames(): string[] {
        return [...AbstractImporter.importers.keys()];
    }

    /**
     * Register a new importer.
     * @param name the importer's name
     * @param importer the importer
     */
    public static register(name: string, importer: AbstractImporter) {
        if (AbstractImporter.importers.has(name)) {
            const knownImporter = AbstractImporter.importers.get(name);
            if (knownImporter)
                throw new NotFoundError("Importer with name " + name + " is already known: " + knownImporter.constructor);
        }
        AbstractImporter.importers.set(name, importer);
    }

    /**
     * Returns an importer instance by its name.
     * @param name the name of the importer
     */
    public static forName(name: string): AbstractImporter {
        if (AbstractImporter.importers.has(name)) {
            const knownImporter = AbstractImporter.importers.get(name);
            if (knownImporter)
                return knownImporter;
        }
        throw new Error("Importer unknown for name " + name);
    }

    /**
     * Imports an annotated corpus.
     * @param corpusName the name of the new corpus
     * @param annotationSetName the name of the annotation set, where new annotations will be stored
     * @param files the files that should be imported.
     * @return the imported corpus.
     */
    async import(corpusName: string, annotationSetName: string, files: Express.Multer.File[]): Promise<Corpus> {
        const totalFiles = []
        const tmpFolders = []

        try {
            const [zipFiles, regularFiles] = _.partition(files, f => ["application/zip", "application/x-zip-compressed", "multipart/x-zip"].includes(f.mimetype))
            for (const file of zipFiles) {
                const readableBuffer = new streamBuffers.ReadableStreamBuffer();
                readableBuffer.put(file.buffer)
                readableBuffer.stop();

                const tmpZipFolder = tmp.dirSync()
                tmpFolders.push(tmpZipFolder)
                console.log('Creating temporary directory: ', tmpZipFolder.name);

                await readableBuffer.pipe(unzipper.Extract({ path: tmpZipFolder.name })).promise();

                const extractedFiles = await new Promise<string[]>((resolve, reject) => {
                    recursive(tmpZipFolder.name, [], (err, _files) => {
                        resolve(_files)
                    })
                })
                totalFiles.push(...extractedFiles)
            }

            const tmpFolder = tmp.dirSync()
            console.log('Creating temporary directory: ', tmpFolder.name);
            tmpFolders.push(tmpFolder)
            for (const file of regularFiles) {
                const filePath = path.join(tmpFolder.name, file.originalname);
                fs.writeFileSync(filePath, file.buffer.toString())
                totalFiles.push(filePath)
            }
            const importDocuments: ImportDocument[] = await this.doImport(corpusName, annotationSetName, totalFiles)
            return await this.persist(corpusName, annotationSetName, importDocuments)
        } catch (e) {
            throw e;
        } finally {
            tmpFolders.forEach(tmpFolder => {
                rimraf.sync(path.join(tmpFolder.name, "/*"))
                tmpFolder.removeCallback()
                console.log("Deleted temporary directory:", tmpFolder.name)
            })
        }
    }

    /**
     * Imports an annotated corpus. This method should not persist anything.
     * @param corpusName the name of the new corpus
     * @param annotationSetName the name of the annotation set, where new annotations will be stored
     * @param files the files that should be imported.
     * @return the imported documents.
     */
    protected abstract doImport(corpusName: string, annotationSetName: string, files: string[]): Promise<ImportDocument[]>

    /**
     * This method persist the import results that have been produces by method doImport.
     * @param corpusName the name of the new corpus
     * @param annotationSetName the name of the annotation set, where new annotations will be stored
     * @param documents the documents that result from doImport
     * @return the new corpus..
     */
    private async persist(corpusName: string, annotationSetName: string, documents: ImportDocument[]): Promise<Corpus> {
        const corpus = await this.corpusRepository.save({
            name: corpusName,
            description: "Imported Corpus."
        } as Corpus)

        const annotations = new Map<string, AnnotationAttributes>();
        let fallbackAnnotationSet: AnnotationSet | undefined
        for (const importDocument of documents) {
            const document = await this.documentRepository.save({
                filename: importDocument.fileName,
                content: importDocument.content,
                documentHash: Hashing.sha256Hash(importDocument.content),
                corpusId: corpus.corpusId
            } as Document)

            for (const tag of importDocument.tags) {
                let annotation: Annotation | null;
                if (annotations.has(tag.annotation.name)) {
                    if (!annotations.get(tag.annotation.name))
                        throw Error("Annotation with name " + tag.annotation.name + " is undefined though its being found in set of existing annotations.")
                    // @ts-ignore
                    annotation = annotations.get(tag.annotation.name)
                } else {
                    annotation = await this.annotationRepository.getByName(tag.annotation.name);
                    if (!annotation) {
                        if (!fallbackAnnotationSet) {
                            const mayBeAnnotationSet = await this.annotationSetRepository.getByName(annotationSetName)
                            fallbackAnnotationSet = mayBeAnnotationSet ? mayBeAnnotationSet :
                                await this.annotationSetRepository.save({
                                    name: annotationSetName,
                                    description: "Auto-generated Annotation Set"
                                } as AnnotationSet)
                            corpus.addAnnotationSet(fallbackAnnotationSet)
                        }
                        annotation = await this.annotationRepository.save({
                            name: tag.annotation.name,
                            color: tag.annotation.color || chroma.random().hex(),
                            annotationSetId: fallbackAnnotationSet.annotationSetId
                        } as Annotation)
                    }
                    annotations.set(annotation.name, annotation)
                }
                if (!annotation) {
                    throw new Error("Annotation for Tag from " + tag.toIndex + " to " + tag.toIndex + " defined as " + tag.annotation.name + " could not be imported.")
                }
                await this.tagRepository.save({
                    documentId: document.documentId,
                    annotationId: annotation.annotationId,
                    startIndex: tag.fromIndex,
                    endIndex: tag.toIndex,
                } as Tag)
            }
        }

        return corpus;
    }

}