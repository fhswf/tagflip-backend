import { AnnotationRepository } from '../../persistence/dao/AnnotationRepository';
import { AnnotationSetRepository } from '../../persistence/dao/AnnotationSetRepository';
import { CorpusRepository } from '../../persistence/dao/CorpusRepository';
import { DocumentRepository } from '../../persistence/dao/DocumentRepository';
import { Document } from "../../persistence/model/Document";
import { TagRepository } from '../../persistence/dao/TagRepository';
import { Annotation } from '../../persistence/model/Annotation';
import { AnnotationSet } from '../../persistence/model/AnnotationSet';
import { Corpus } from '../../persistence/model/Corpus';
import { Tag } from '../../persistence/model/Tag';
import DocumentExtractor from '../../util/Hashing';
import { Inject } from 'typescript-ioc';
import { InternalServerError } from 'typescript-rest/dist/server/model/errors';

export interface Marker {
    start: number
    end: number
    name: string
}

export interface Record {
    text: string;
    annotations: Marker[]
    tagSet: Set<string>
}

/**
 * Base class for corpus importer.
 */
export abstract class CorpusImporter {

    private static importers: Map<string, CorpusImporter> = new Map<string, CorpusImporter>()

    static register(formats: string[], importer: CorpusImporter) {
        formats.forEach(format => {
            CorpusImporter.importers.set(format, importer);
        })
    }

    static forFormat(format: string): CorpusImporter {
        if (CorpusImporter.importers.has(format)) {
            let importer = CorpusImporter.importers.get(format);
            if (importer == undefined) {
                throw new Error(`no importer for ${format}`)
            }
            return importer;
        }
        else throw new Error(`no importer for ${format}`)
    }

    @Inject
    corpusRepository!: CorpusRepository;

    @Inject
    documentRepository!: DocumentRepository;

    @Inject
    tagRepository!: TagRepository;

    @Inject
    annotationRepository!: AnnotationRepository;

    @Inject
    annotationSetRepository!: AnnotationSetRepository;


    constructor() {
    }

    abstract async importFile(corpus: Corpus, file: Express.Multer.File, annotationSetName: string): Promise<void>

    async saveRecords(corpus: Corpus, file: Express.Multer.File, text: string, tags: Marker[],
        annotationSetName: string, tagSet: Set<string>) {
        // Get all annotations supported by 
        let annotationMap = new Map<string, Annotation>();
        if (corpus.annotationSets) {
            corpus.annotationSets.forEach((annotationSet) => {
                annotationSet.annotations.forEach((annotation) => {
                    annotationMap.set(annotation.name, annotation);
                });
            });
        }

        // Get the tags wich are not already present and create a new AnnotationSet
        const newTags = [...tagSet].filter((name) => !annotationMap.has(name));
        console.log('new tags: %o', newTags);

        if (newTags.length > 0) {
            try {
                // if there is altready an AnnotationSet with the requested name, use and amend it
                let mayBeAnnotationSet = await this.annotationSetRepository.getByName(annotationSetName);
                let annotationSet: AnnotationSet = mayBeAnnotationSet ? mayBeAnnotationSet :
                    await this.annotationSetRepository.save({
                        name: annotationSetName,
                        description: "Imported from " + file.filename
                    } as AnnotationSet);
                corpus.addAnnotationSet(annotationSet);

                this.corpusRepository.save(corpus);

                newTags.forEach(async (name) => {
                    try {
                        let annotation: Annotation = await this.annotationRepository.save({
                            name: name,
                            annotationSetId: annotationSet.annotationSetId
                        } as Annotation);
                        annotationMap.set(annotation.name, annotation);
                    }
                    catch (ex) {
                        console.log('failed to create annotation "' + name + '": ' + ex);
                        throw new InternalServerError('failed to create annotation "' + name + '": ' + ex);
                    }
                });
                this.annotationSetRepository.save(annotationSet);
            }
            catch (ex) {
                console.log('failed to create annotationset"' + annotationSetName + '": ' + ex);
                throw new InternalServerError('failed to create annotationset: ' + ex);
            }
        }

        let document: Document = await this.documentRepository.save(
            {
                filename: file.filename ? file.filename : "Import_" + DocumentExtractor.sha256Hash(file.buffer),
                content: text,
                corpusId: corpus.corpusId,
                documentHash: DocumentExtractor.sha256Hash(text)
            } as Document,
            { raw: true });
        console.log('documentId: %o', document.documentId);

        console.log('saving tags');
        tags.forEach(async (marker) => {
            let annotation = annotationMap.get(marker.name);
            if (annotation) {
                let tag = await this.tagRepository.save({
                    annotationId: annotation.annotationId,
                    startIndex: marker.start,
                    endIndex: marker.end,
                    documentId: document.documentId
                } as Tag);
                console.log('tag saved: %o %d %d', tag.id, tag.startIndex, tag.endIndex);
            }
            else {
                console.log('no annotation found for tag name %s', marker.name);
            }
        });
        this.documentRepository.save(document);
    }
}

export const format = (types: string[]) => {
    console.log("Discovered CorpusImporter for types:", types);
    return <T extends { new(...args: any[]): CorpusImporter }>(constructor: T) => {
        CorpusImporter.register(types, new constructor())
    }
}