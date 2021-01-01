import AbstractImporter, { ImportAnnotation, ImportDocument, Importer, ImportTag } from "../AbstractImporter";

import * as fs from "fs";
import * as _ from "lodash"
import * as path from "path";
import { createInterface } from "readline";

interface Record {
    text: string;
    annotations: ImportTag[]
    tagSet: Set<string>
}


export class IOBImporter extends AbstractImporter {
    splitter: RegExp;
    nerFields: number[];
    name: string;
    extensions?: string[];
    textField: number;

    constructor(splitter: RegExp, textField: number, nerFields: number[], extensions?: string[], name = "IOB importer") {
        super()
        this.splitter = splitter
        this.nerFields = nerFields
        this.name = name
        this.extensions = extensions
        this.textField = textField
    }

    protected async doImport(corpusName: string, annotationSetName: string, files: string[]): Promise<ImportDocument[]> {
        console.log('%s: doImport: %s %s %o', this.name, corpusName, annotationSetName, files)
        const tagSet = new Set<string>()
        if (this.extensions) {
            const ext = this.extensions
            files = _.filter(files, (x) => path.extname(x) in ext) || []
        }
        const documents = []
        for (const file of files) {
            console.log('%s: Importing %s', this.name, file)
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
                tags,
            }

            console.info('%s import: %j', this.name, document)
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
            text += fields[this.textField] + ' '
            end[i] = text.length - 1

            this.nerFields.forEach((fieldNo, j) => {
                const tag = fields[fieldNo]
                if (tag[0] !== 'I') {
                    // Is the a tag to end?
                    const marker = current[j]
                    if (marker != null) {
                        marker.toIndex = end[i - 1]
                        annos.push(marker)
                        current[j] = null
                    }
                }
                if (tag[0] === 'B') {
                    // start new tag
                    tagSet.add(tag.split('-')[1])
                    current[j] = {
                        annotation: { name: tag.split('-')[1] },
                        fromIndex: start[i],
                        toIndex: -1,
                    }
                }
                else if (tag[0] === 'I' && current[j] == null) {
                    // start new tag, even if it starts with I-(NER type)
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

        return { text, annotations: annos, tagSet }
    }
}