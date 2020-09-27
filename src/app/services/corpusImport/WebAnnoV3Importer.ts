import { Corpus } from '../../persistence/model/Corpus';
import { createInterface } from "readline";
import { Readable } from 'stream';
import { CorpusImporter, Marker, Record, format } from './CorpusImporter';

/** Import files in the WebAnnoV3 format.
 * See {@link https://webanno.github.io/webanno/releases/3.0.0/docs/user-guide.html#sect_webannotsv}
 * for a description of the format.
 */
@format(['WebAnno V3'])
export class WebAnnoV3Importer extends CorpusImporter {

    VERSION_RE = new RegExp("\#FORMAT\=(WebAnno TSV .*)");

    constructor() {
        super()
    }

    async importFile(corpus: Corpus, file: Express.Multer.File, annotationSetName: string) {
        let tagSet = new Set<string>();
        let stream = Readable.from(file.buffer);
        let input = createInterface({
            input: stream,
            crlfDelay: Infinity
        });

        let text = "";
        let lines: string[][] = [];
        let tags: Marker[] = [];
        let lineNo = 0;

        for await (const line of input) {
            lineNo++;
            if (lineNo == 1) {
                let matches = line.match(this.VERSION_RE);
                if (!matches) {
                    throw Error('not a WebAnno file');
                }
                else {
                    console.log('matches: %o', matches);
                }
                continue;
            }

            let fields = line.split('\t');
            if (fields[0].startsWith('#'))
                continue;

            // Start of a new record in the IOB file
            if (fields.length < 2) {
                const record = this.createRecord(lines);
                record.tagSet.forEach((tag: string) => tagSet.add(tag));
                let offset = text.length;
                text += record.text + '\n';
                record.annotations.forEach((anno: Marker) => {
                    anno.start += offset;
                    anno.end += offset;
                    tags.push(anno);
                });
                lines = [];
            }
            else {
                lines.push(fields);
            }
        }

        //this.saveRecords(file, text, tags, annotationSetName, tagSet)
    }

    createRecord(lines: string[][]): Record {
        let text = '';
        let annos: Marker[] = [];
        let current: (Marker | null)[] = [null, null];
        let start: number[] = [];
        let end: number[] = [];
        let tagSet = new Set<string>();

        lines.forEach((fields, i) => {
            start[i] = text.length;
            text += fields[2] + ' ';
            end[i] = text.length - 1;

            fields[4].split('|').forEach((tag) => {
                console.log("tags: %s", tag)
            });
        });

        current.forEach((marker) => {
            if (marker) {
                marker.end = end[end.length - 1];
                annos.push(marker);
            }
        });

        return { text: text, annotations: annos, tagSet: tagSet };
    }
}
