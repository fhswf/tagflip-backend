import { Importer } from "../AbstractImporter";
import { CoNLLImporter } from "./CoNLLImporter";

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
export class GermEval2014_Importer extends CoNLLImporter {

    protected static EXT: string[] = [".conll"]
    protected static NER_FIELD: number = 2
    protected static WORD_FIELD: number = 1
    protected static SPLITTER: RegExp = /\t/

    constructor() {
        super(GermEval2014_Importer.WORD_FIELD, GermEval2014_Importer.NER_FIELD, GermEval2014_Importer.SPLITTER)
    }
}