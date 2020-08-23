import { Inject, Singleton } from "typescript-ioc";
import { CorpusRepository } from "../../persistence/dao/CorpusRepository";
import { Document } from "../../persistence/model/Document";
import { Corpus } from '../../persistence/model/Corpus';
import { AnnotationSet } from '../../persistence/model/AnnotationSet';
import { createInterface } from "readline";
import * as fs from "fs";
import { Tag } from '../../persistence/model/Tag';
import { DocumentRepository } from '../../persistence/dao/DocumentRepository';
import Hashing from "../../util/Hashing";
import { TagRepository } from '../../persistence/dao/TagRepository';
import { Annotation } from '../../persistence/model/Annotation';
import { AnnotationSetRepository } from '../../persistence/dao/AnnotationSetRepository';
import { AnnotationRepository } from '../../persistence/dao/AnnotationRepository';

@Singleton
export class CorpusImportService {

    @Inject
    private corpusRepository!: CorpusRepository


    public async import(corpusId: number, name: string, annotationSetName: string, files: Express.Multer.File[]): Promise<Corpus> {
        let corpus: Corpus = new Corpus({ corpusId: corpusId, name: name, description: "Imported Corpus" })

        /** @todo Chose importer by file type */
        const importer = new NoStaDImporter(corpus)
        // import files as documents and tags
        files.forEach(async (file) => await importer.importFile(corpus, file, annotationSetName))
        // save corpus
        return this.corpusRepository.save(corpus)
    }
}

interface Marker {
    start: number
    end: number
    name: string
}

interface Record {
    text: string;
    annotations: Marker[]
    tagSet: Set<string>
}

/** Import files in the NoSta-D format.  
 * See {@link https://www.linguistik.hu-berlin.de/de/institut/professuren/korpuslinguistik/forschung/nosta-d} 
 * for a description of the format.
 */
class NoStaDImporter {
    @Inject
    private documentRepository!: DocumentRepository

    @Inject
    private tagRepository!: TagRepository

    @Inject
    private annotationRepository!: AnnotationRepository

    @Inject
    private annotationSetRepository!: AnnotationSetRepository

    corpus: Corpus;

    constructor(corpus: Corpus) {
        this.corpus = corpus
    }

    createRecord(lines: string[][]): Record {
        let text = ''
        let annos: Marker[] = []
        let current: (Marker | null)[] = [null, null]
        let start: number[] = []
        let end: number[] = []
        let tagSet = new Set<string>()

        lines.forEach((fields, i) => {
            start[i] = text.length
            text += fields[1] + ' '
            end[i] = text.length - 1

            fields.slice(2).forEach((tag, j) => {
                if (tag[0] != 'I') {
                    // Is the a tag to end?
                    let marker = current[j]
                    if (marker != null) {
                        marker.end = end[i - 1]
                        annos.push(marker)
                        current[j] = null
                    }
                }
                if (tag[0] == 'B') {
                    // start new tag
                    tagSet.add(tag.split('-')[1])
                    current[j] = {
                        start: start[i],
                        end: -1,
                        name: tag.split('-')[1]
                    }
                }
            })
        });

        current.forEach((marker, j) => {
            if (marker) {
                marker.end = end[end.length - 1]
                annos.push(marker)
            }
        })

        return { text: text, annotations: annos, tagSet: tagSet }
    }

    async importFile(corpus: Corpus, file: Express.Multer.File, annotationSetName: string) {
        let tagSet = new Set<string>()
        let stream = fs.createReadStream(file.path)
        let input = createInterface({
            input: stream,
            crlfDelay: Infinity
        })

        let text = ""
        let lines: string[][] = []
        let tags: Marker[] = []
        for await (const line of input) {
            let fields = line.split('\t')
            if (fields[0].startsWith('#'))
                continue;

            // Start of a new record in the IOB file
            if (fields.length < 2) {
                const record = this.createRecord(lines);
                record.tagSet.forEach((tag) => tagSet.add(tag));
                let offset = text.length;
                text += record.text + '\n';
                record.annotations.forEach((anno) => {
                    anno.start += offset;
                    anno.end += offset;
                    tags.push(anno);
                })
                lines = []
            }
            else {
                lines.push(fields);
            }
        }

        // Get all annotations supported by 
        let annotations = new Map<string, Annotation>()
        corpus.annotationSets.forEach((annotationSet) => {
            annotationSet.annotations.forEach((annotation) => {
                annotations.set(annotation.name, annotation)
            })
        })

        // Get the tags wich are not already present and create a new AnnotationSet
        const newTags = [...tagSet].filter((name) => annotations.has(name))
        if (newTags.length > 0) {
            let annotationSet: AnnotationSet = await this.annotationSetRepository.save({
                name: annotationSetName,
                description: "Imported from " + file.filename
            } as AnnotationSet)
            corpus.addAnnotationSet(annotationSet)

            newTags.forEach(async (name) => {
                let annotation: Annotation = await this.annotationRepository.save({
                    name: name
                } as Annotation)
                annotationSet.annotations.push(annotation)
                annotations.set(annotation.name, annotation)
            })

        }

        let document: Document = await this.documentRepository.save({
            filename: file.filename,
            content: text,
            corpusId: corpus.corpusId,
            documentHash: Hashing.sha256Hash(text)
        } as Document, { raw: true })

        corpus.addDocument(document)


        tags.forEach(async (marker) => {
            let annotation = annotations.get(marker.name)
            if (annotation) {
                let tag = await this.tagRepository.save({
                    annotationId: annotation.annotationId,
                    startIndex: marker.start,
                    endIndex: marker.end
                } as Tag)
                document.tags.push(tag)
            }
        })
    }
}
