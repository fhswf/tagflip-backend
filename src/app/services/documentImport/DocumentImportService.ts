import { Inject, Singleton } from "typescript-ioc";
import { CorpusRepository } from "../../persistence/dao/CorpusRepository";
import DocumentExtractor from "./persistors";
import { Document } from "../../persistence/model/Document";
import { RequireTransaction } from "../../persistence/decorator/Transaction";

@Singleton
export class DocumentImportService {

    @Inject
    private corpusRepository!: CorpusRepository


    @RequireTransaction
    public async import(corpusId: number, files: Express.Multer.File[]): Promise<Document[]> {
        const totalDocuments = new Array<Document>();
        for (const file of files) {
            totalDocuments.push(...await DocumentExtractor.forType(file.mimetype).persist(corpusId, file));
        }

        return totalDocuments;
    }
}



