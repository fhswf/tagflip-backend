import { CoNLLImporter } from "./CoNLLImporter";
import { Importer } from "../AbstractImporter";


/** Import NER corpus in CoNLL 2003 format (columns separated by spaces)
 * 
 * Column   Description
 * 0        word
 * 1        POS (ignored)
 * 2        SYN (ignored)
 * 3        NER (in BIO format)
 */
@Importer("CoNLL 2003 (NER)")
export class CoNLL2003_Importer extends CoNLLImporter {

    protected static EXT: string[] = [".conll"]
    protected static NER_FIELD = 3
    protected static WORD_FIELD = 0
    protected static SPLITTER = ' '

    constructor() {
        super(CoNLL2003_Importer.WORD_FIELD, CoNLL2003_Importer.NER_FIELD, CoNLL2003_Importer.SPLITTER)
    }
}