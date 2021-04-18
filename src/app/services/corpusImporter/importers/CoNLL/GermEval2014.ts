import AbstractImporter, { ImportAnnotation, ImportDocument, Importer, ImportTag } from "../AbstractImporter";
import { createInterface } from "readline";
import * as path from "path";
import * as fs from "fs";
import * as _ from "lodash"
import { Annotation } from 'src/app/persistence/model/Annotation';
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

    static EXT: string[] = [".conll"]
    static NER_FIELD = 2
    static WORD_FIELD = 1
    static SPLITTER = /\t/

    constructor() {
        super(GermEval2014_Importer.WORD_FIELD, GermEval2014_Importer.NER_FIELD, GermEval2014_Importer.SPLITTER)
    }
}