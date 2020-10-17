import {Singleton} from "typescript-ioc";
import AbstractImporter from "./importers";
import {RequireTransaction} from "../../persistence/decorator/Transaction";
import {Corpus} from "../../persistence/model/Corpus";

@Singleton
export default class AnnotatedCorpusImportService {

    @RequireTransaction
    public async import(importer: string, corpusName: string, annotationSetName: string, files: Express.Multer.File[]) : Promise<Corpus> {
        return await AbstractImporter.forName(importer).import(corpusName, annotationSetName, files);
    }
}



