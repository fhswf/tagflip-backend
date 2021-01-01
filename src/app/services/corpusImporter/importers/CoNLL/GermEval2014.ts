import { Importer, ImportTag } from "../AbstractImporter"
import { IOBImporter } from "./IOBImporter"


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
export class GermEval2014Importer extends IOBImporter {

    static EXT = [".tsv"]

    constructor() {
        super(/\t/, 1, [2, 3], undefined, "GermEval2014 (NER)")
    }
}