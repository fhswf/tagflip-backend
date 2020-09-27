import { Corpus } from '../../persistence/model/Corpus';
import { createInterface } from "readline";
import { Readable } from 'stream';
import { CorpusImporter, Marker, Record, format } from './CorpusImporter';

/** Import files in the NoSta-D format.
 * See {@link https://www.linguistik.hu-berlin.de/de/institut/professuren/korpuslinguistik/forschung/nosta-d}
 * for a description of the format.
 */
@format(['NoStaD'])
export class NoStaDImporter extends CorpusImporter {

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
        for await (const line of input) {
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

        this.saveRecords(corpus, file, text, tags, annotationSetName, tagSet)
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
            text += fields[1] + ' ';
            end[i] = text.length - 1;

            fields.slice(2).forEach((tag, j) => {
                if (tag[0] != 'I') {
                    // Is the a tag to end?
                    let marker = current[j];
                    if (marker != null) {
                        marker.end = end[i - 1];
                        annos.push(marker);
                        current[j] = null;
                    }
                }
                if (tag[0] == 'B') {
                    // start new tag
                    tagSet.add(tag.split('-')[1]);
                    current[j] = {
                        start: start[i],
                        end: -1,
                        name: tag.split('-')[1]
                    };
                }
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
