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

/** Import NER corpus in CoNLL 2003 format (columns separated by spaces)
 * 
 * Column   Description
 * 0        word
 * 1        POS (ignored)
 * 2        SYN (ignored)
 * 3        NER (in BIO format)
 */
@Importer("CoNLL 2003 (NER)")
export class NoStaDImporter extends AbstractImporter {

    static EXT = [".conll"]

    constructor() {
        super()
    }

    protected async doImport(corpusName: string, annotationSetName: string, files: string[]): Promise<ImportDocument[]> {
        console.log('CoNLL 2003: doImport: %s %s %o', corpusName, annotationSetName, files)
        let tagSet = new Set<string>()
        //files = _.filter(files, x => path.extname(x) in NoStaDImporter.EXT) || []
        let documents = []
        for (const file of files) {
            console.log('NoStaD: Importing %s', file)
            let stream = fs.createReadStream(file)
            let input = createInterface({
                input: stream,
                crlfDelay: Infinity
            })

            let text = ""
            let lines: string[][] = []
            let tags: ImportTag[] = []
            for await (const line of input) {
                let fields = line.split(' ')
                if (fields[0].startsWith('#'))
                    continue;

                // Start of a new record in the IOB file
                if (fields.length < 2) {
                    const record = this.createRecord(lines);
                    record.tagSet.forEach((tag) => tagSet.add(tag));
                    let offset = text.length;
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

            let document: ImportDocument = {
                tags: tags,
                fileName: path.basename(file),
                content: text
            }

            console.info('NoStaD import: %j', document)
            documents.push(document)
        }
        return Promise.resolve(documents)
    }

    createRecord(lines: string[][]): Record {
        let text = ''
        let annos: ImportTag[] = []
        let current: (ImportTag | null)[] = [null, null]
        let start: number[] = []
        let end: number[] = []
        let tagSet = new Set<string>()

        lines.forEach((fields, i) => {
            start[i] = text.length
            text += fields[0] + ' '
            end[i] = text.length - 1

            fields.slice(3).forEach((tag, j) => {
                if (tag[0] != 'I') {
                    // Is the a tag to end?
                    let marker = current[j]
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
                        fromIndex: start[i],
                        toIndex: -1,
                        annotation: { name: tag.split('-')[1] }
                    }
                }
                else if (tag[0] == 'I' && current[j] == null) {
                    // start new tag, even if it starts with I-(NER type)
                    tagSet.add(tag.split('-')[1])
                    current[j] = {
                        fromIndex: start[i],
                        toIndex: -1,
                        annotation: { name: tag.split('-')[1] }
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

        return { text: text, annotations: annos, tagSet: tagSet }
    }


}