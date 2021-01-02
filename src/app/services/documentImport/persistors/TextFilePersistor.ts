import { Inject } from "typescript-ioc";
import { CorpusRepository } from "../../../persistence/dao/CorpusRepository";
import { Document } from "../../../persistence/model/Document";
import DocumentPersistor, { mimetypes } from "./DocumentPersistor";
import Hashing from "../../../util/Hashing";
import { DocumentRepository } from "../../../persistence/dao/DocumentRepository";

@mimetypes(["text/plain"])
export default class TextFilePersistor extends DocumentPersistor {

    @Inject
    private corpusRepository!: CorpusRepository

    @Inject
    private documentRepository!: DocumentRepository

    async persist(corpusId: number, file: Express.Multer.File): Promise<Document[]> {
        const fileContent = file.buffer.toString()
        const corpus = await this.corpusRepository.read(corpusId);

        const document: Document = await this.documentRepository.save({
            filename: file.originalname,
            content: fileContent,
            corpusId: corpus.corpusId,
            documentHash: Hashing.sha256Hash(fileContent)
        } as Document, { raw: true })
        document.content = undefined
        // let {content, ... strippedDocument} = Object.assign({}, document);
        return [document]
    }

}
