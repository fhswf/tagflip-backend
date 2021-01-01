import { Importer, ImportTag } from "../AbstractImporter";
import { IOBImporter } from "./IOBImporter";

/** Import NER corpus in CoNLL 2003 format (columns separated by spaces)
 *
 * Column   Description
 * 0        word
 * 1        POS (ignored)
 * 2        SYN (ignored)
 * 3        NER (in BIO format)
 */
@Importer("CoNLL 2003 (NER)")
export class CoNLL2003Importer extends IOBImporter {

    static EXT = [".conll"]

    constructor() {
        super(/\ /, 0, [3], undefined, "CoNLL 2003 (NER)")
    }
}