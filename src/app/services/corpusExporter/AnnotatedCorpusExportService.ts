import {Singleton} from "typescript-ioc";
import AbstractExporter from "./exporters";

@Singleton
export default class AnnotatedCorpusExportService {

    public async export(exporter: string, corpusId: number) : Promise<any> {
        return await AbstractExporter.forName(exporter).export(corpusId)
    }
}



