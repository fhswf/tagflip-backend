import { Document } from "../../../persistence/model/Document";

export default abstract class DocumentPersistor {

    private static persistors: Map<string, DocumentPersistor> = new Map<string, DocumentPersistor>()

    public static register(mimetypes: string[], extractor: DocumentPersistor) {
        for (let mimetype of mimetypes) {
            if (DocumentPersistor.persistors.has(mimetype)) {
                let knownExtractor = DocumentPersistor.persistors.get(mimetype);
                if (knownExtractor)
                    throw new Error("Extractor for mimetype " + mimetype + " is already known: " + knownExtractor.constructor);
            }
            DocumentPersistor.persistors.set(mimetype, extractor);
        }
    }

    public static forType(mimetype: string): DocumentPersistor {
        if (DocumentPersistor.persistors.has(mimetype)) {
            let knownPersitor = DocumentPersistor.persistors.get(mimetype);
            if (knownPersitor)
                return knownPersitor;
        }
        throw new Error("Persistor unknown for mimetype " + mimetype);
    }

    abstract persist(corpusId: number, file: Express.Multer.File): Promise<Document[]>

}

export const mimetypes = <T extends DocumentPersistor>(types: string[]) => {
    console.log("Discovered DocumentPersistor for types:", types);
    return <T extends { new(...args: any[]): DocumentPersistor }>(constructor: T) => {
        DocumentPersistor.register(types, new constructor())
    }
}
