import { Inject, Singleton } from "typescript-ioc";
import { CorpusRepository } from "../../persistence/dao/CorpusRepository";
import { Corpus } from '../../persistence/model/Corpus';
import * as fs from "fs";
import { InternalServerError } from 'typescript-rest/dist/server/model/errors';
import { NoStaDImporter } from './NoStaDImporter';

/**
 * @deprecated
 */
@Singleton
export class CorpusImportService {

    @Inject
    private corpusRepository!: CorpusRepository


    public async import(name: string, annotationSetName: string, files: Express.Multer.File[]): Promise<Corpus> {
        let corpus: Corpus = await this.corpusRepository.save({ name: name, description: "Imported Corpus" } as Corpus)

        /** @todo Chose importer by file type */
        const importer = new NoStaDImporter(corpus)
        // import files as documents and tags
        try {
            files.forEach(async (file) => await importer.importFile(corpus, file, annotationSetName))
        }
        catch (ex) {
            throw new InternalServerError("Exception in importFile: " + ex)
        }

        // save corpus
        return this.corpusRepository.save(corpus)
    }
}

export interface Marker {
    start: number
    end: number
    name: string
}

export interface Record {
    text: string;
    annotations: Marker[]
    tagSet: Set<string>
}


