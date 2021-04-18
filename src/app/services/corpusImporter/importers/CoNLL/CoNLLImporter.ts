import AbstractImporter, { ImportAnnotation, ImportDocument, Importer, ImportTag } from "../AbstractImporter";
import { createInterface } from "readline";
import * as path from "path";
import * as fs from "fs";
import * as _ from "lodash"
import { Annotation } from 'src/app/persistence/model/Annotation';

interface Record {
    text: string;
    annotations: ImportTag[]
    tagSet: Set<string>
}

/** Abstract importer for CoNLL style tsv files
 */
export class CoNLLImporter extends AbstractImporter {
    protected wordField: number;
    protected nerField: number;
    protected splitter: RegExp | string;

    constructor(wordField: number, nerField: number, splitter: RegExp | string) {
        super()
        this.wordField = wordField
        this.nerField = nerField
        this.splitter = splitter
    }

    protected async doImport(corpusName: string, annotationSetName: string, files: string[]):
        Promise<ImportDocument[]> {
        console.log('CoNLL: doImport: %s %s %o', corpusName, annotationSetName, files)
        const tagSet = new Set<string>()
        const documents = []
        for (const file of files) {
            console.log('CoNLL: Importing %s', file)
            const stream = fs.createReadStream(file)
            const input = createInterface({
                crlfDelay: Infinity,
                input: stream,
            })

            let text = ""
            let lines: string[][] = []
            const tags: ImportTag[] = []
            for await (const line of input) {
                const fields = line.split(this.splitter)
                if (fields[0].startsWith('#'))
                    continue;

                // Start of a new record in the IOB file
                if (fields.length < 2) {
                    const record = this.createRecord(lines);
                    record.tagSet.forEach((tag) => tagSet.add(tag));
                    const offset = text.length;
                    text += record.text + '\n';
                    record.annotations.forEach((anno) => {
                        anno.fromIndex += offset;
                        anno.toIndex += offset;
                        tags.push(anno);
                    })
                    lines = []
                }
                else {
                    lines.push(fields);
                }
            }

            const document: ImportDocument = {
                content: text,
                fileName: path.basename(file),
                tags: tags,
            }

            console.info('CoNLL import: %j', document)
            documents.push(document)
        }
        return Promise.resolve(documents)
    }

    createRecord(lines: string[][]): Record {
        let text = ''
        const annos: ImportTag[] = []
        const current: (ImportTag | null)[] = [null, null]
        const start: number[] = []
        const end: number[] = []
        const tagSet = new Set<string>()

        lines.forEach((fields, i) => {
            start[i] = text.length
            text += fields[this.wordField] + ' '
            end[i] = text.length - 1

            fields.slice(this.nerField).forEach((tag, j) => {
                if (tag[0] != 'I') {
                    // Is the a tag to end?
                    const marker = current[j]
                    if (marker != null) {
                        marker.toIndex = end[i - 1]
                        annos.push(marker)
                        current[j] = null
                    }
                }
                if (tag[0] == 'B') {
                    // start new tag
                    tagSet.add(tag.split('-')[1])
                    current[j] = {
                        annotation: { name: tag.split('-')[1] },
                        fromIndex: start[i],
                        toIndex: -1,
                    }
                }
            })
        });

        current.forEach((marker, j) => {
            if (marker) {
                marker.toIndex = end[end.length - 1]
                annos.push(marker)
            }
        })

        return { annotations: annos, tagSet: tagSet, text: text, }
    }
}
