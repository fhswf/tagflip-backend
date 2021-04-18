import { NotFoundError } from "typescript-rest/dist/server/model/errors";
import * as tmp from "tmp";
import * as rimraf from "rimraf";
import * as path from "path";
import * as AdmZip from "adm-zip";
import { BeginTransaction } from "../../../persistence/decorator/Transaction";

/**
 * Declares a type being an exporter for an annotated Corpus.
 * @param name the name of the exporter.
 * @constructor the constructor of the type.
 */
export const Exporter = <T extends AbstractExporter>(name: string) => {
    console.log("Discovered Exporter with name:", name);
    return <T extends { new(...args: any[]): AbstractExporter }>(constructor: T) => {
        AbstractExporter.register(name, new constructor())
    }
}

/**
 * This class defines an abstract definition of an exporter that is able to export an annotated corpus.
 */
export default abstract class AbstractExporter {

    /**
     * The known exporters
     * @private
     */
    private static exporters: Map<string, AbstractExporter> = new Map<string, AbstractExporter>()

    /**
     * Returns a list of known exporters.
     * @return a list of known exporters
     */
    public static getExporterNames(): string[] {
        return [...AbstractExporter.exporters.keys()];
    }

    /**
     * Register a new exporter.
     * @param name the exporter's name
     * @param exporter the exporter
     */
    public static register(name: string, exporter: AbstractExporter) {
        if (AbstractExporter.exporters.has(name)) {
            let knownExporter = AbstractExporter.exporters.get(name);
            if (knownExporter)
                throw new Error("Exporter with name " + name + " is already known: " + knownExporter.constructor);
        }
        AbstractExporter.exporters.set(name, exporter);
    }

    /**
     * Returns an exporter instance by its name.
     * @param name the name of the exporter
     */
    public static forName(name: string): AbstractExporter {
        if (AbstractExporter.exporters.has(name)) {
            let knownExporter = AbstractExporter.exporters.get(name);
            if (knownExporter)
                return knownExporter;
        }
        throw new NotFoundError("Exporter unknown for name " + name);
    }

    /**
     * Exports the corpus with given ID.
     * @param corpusId the ID of the corpus to be exported.
     * @return a ZIP-Buffer containing the export-result.
     */
    public async export(corpusId: number): Promise<Buffer> {
        let tmpDir = tmp.dirSync()
        console.log('Creating temporary directory: ', tmpDir.name);
        try {
            await this.exportWithinTransaction(corpusId, tmpDir.name); // export to tmp dir
            let zip = new AdmZip();
            zip.addLocalFolder(tmpDir.name); // form zip of tmp dir
            return zip.toBuffer(); // load zip for response
        } finally {
            rimraf.sync(path.join(tmpDir.name, "/*")) // cleanup
            tmpDir.removeCallback()
            console.log("Deleted temporary directory:", tmpDir.name)
        }
    }

    @BeginTransaction
    private async exportWithinTransaction(corpusId: number, targetFolder: string): Promise<void> {
        return this.doExport(corpusId, targetFolder);
    }

    /**
     * Exports the corpus with given ID to the given temporary target directory.
     * @param corpusId the ID of the corpus to be exported.
     * @param targetFolder a folder in the local filesystem where the export result can be stored safely
     */
    protected abstract doExport(corpusId: number, targetFolder: string): Promise<void>


}