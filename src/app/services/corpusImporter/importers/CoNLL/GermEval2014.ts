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

/** Import tsv files as used in GermEval2014.  
 * See {@link https://www.linguistik.hu-berlin.de/de/institut/professuren/korpuslinguistik/forschung/nosta-d} 
 * for a description of the format.
 * 
 * Column   Description
 * 0        index
 * 1        word
 * 2        NER 1 (in BIO format)
 * 3        NER 2 (in BIO format)
 */
@Importer("GermEval2014 (NER)")
export class NoStaDImporter extends AbstractImporter {

    static EXT = [".tsv"]

    constructor() {
        super()
    }

    protected async doImport(corpusName: string, annotationSetName: string, files: string[]): Promise<ImportDocument[]> {
        console.log('NoStaD: doImport: %s %s %o', corpusName, annotationSetName, files)
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
                let fields = line.split(/\t/)
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
            text += fields[1] + ' '
            end[i] = text.length - 1

            fields.slice(2).forEach((tag, j) => {
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