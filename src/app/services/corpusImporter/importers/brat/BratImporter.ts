import AbstractImporter, {ImportAnnotation, ImportDocument, Importer} from "../AbstractImporter";
import * as path from "path";
import * as fs from "fs";
import * as _ from "lodash"
import AnnotationConfParser from "./AnnotationConfParser";
import VisualConfParser from "./VisualConfParser";
import AnnParser from "./AnnParser";

/**
 * An Importer for the BRAT Standoff format. For more information see {@link https://brat.nlplab.org/standoff.html}.
 */
@Importer("BRAT (Entities only - without Relations, Events, Attributes)")
export class BratImporter extends AbstractImporter {

    static ANN_EXT = ".ann"

    static TXT_EXT = ".txt"

    static ANNOTATION_CONF_FILE = "annotation.conf"

    static VISUAL_CONF_FILE = "visual.conf"

    constructor() {
        super();
    }

    async doImport(corpusName: string, annotationSetName: string, files: string[]): Promise<ImportDocument[]> {
        let annotationConf = _.find(files, x => path.basename(x) === BratImporter.ANNOTATION_CONF_FILE)
        let visualConf = _.find(files, x => path.basename(x) === BratImporter.VISUAL_CONF_FILE)

        let annotations: ImportAnnotation[] = []
        if (visualConf) {
            try {
                const visualConfParser = new VisualConfParser();
                const visualConfContent = fs.readFileSync(visualConf)
                annotations = visualConfParser.parse(visualConfContent.toString());
            } catch (e) {
                throw new Error("Could not parse visual.conf-file '" + visualConf + "'. Parser says: " + e.message)
            }

        }
        if (annotationConf) {
            try {
                const annotationConfParser = new AnnotationConfParser();
                const annotationConfContent = fs.readFileSync(annotationConf)
                if (annotations) {
                    annotations = _.intersectionBy(annotations, annotationConfParser.parse(annotationConfContent.toString()), x => x.name) // remove inconsistencies if visual.conf provided
                } else {
                    annotations = annotationConfParser.parse(annotationConfContent.toString())
                }
            } catch (e) {
                throw new Error("Could not parse annotation.conf-file '" + annotationConf + "'. Parser says: " + e.message)
            }
        }

        let txtFiles = _.filter(files, x => path.extname(x) === BratImporter.TXT_EXT) || []
        let filePairs: [string, string][] = []
        for (const txtFile of txtFiles) {
            let fileName = path.basename(txtFile);
            let fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, "")
            let correspondingAnnFile = fileNameWithoutExt + BratImporter.ANN_EXT
            let correspondingAnnFilePath = path.join(path.parse(txtFile).dir, correspondingAnnFile);
            if (!_.find(files, x => x === correspondingAnnFilePath)) {
                throw Error("Missing .ann-file for .txt-file " + txtFile + ". Cannot import inconsistent corpus.")
            }
            filePairs.push([txtFile, correspondingAnnFilePath])
        }

        const documents = []
        const knownAnnotations = new Map<string, ImportAnnotation>(annotations.map(x => [x.name, x]));
        for (const [txtFile, annFile] of filePairs) {
            const annParser = new AnnParser(knownAnnotations);
            const annContent = fs.readFileSync(annFile).toString();
            try {
                let result = annParser.parse(annContent);
                let document: ImportDocument = {
                    tags: result,
                    fileName: path.basename(txtFile),
                    content: fs.readFileSync(txtFile).toString()
                }
                documents.push(document)
            } catch (e) {
                throw new Error("Could not parse ann-file '" + annFile + "'. Parser says: " + e.message)
            }
        }

        return Promise.resolve(documents);
    }

}