import { Singleton } from "typescript-ioc";
import {
  ConflictError,
  HttpError,
} from "typescript-rest/dist/server/model/errors";
import AbstractExporter from "./exporters";

@Singleton
export default class AnnotatedCorpusExportService {
  public async export(
    exporter: string,
    corpusId: number,
    iob?: boolean
  ): Promise<any> {
    const instance = AbstractExporter.forName(exporter);
    if (iob && !instance.supportsIOB()) {
      throw new ConflictError("Selected exporter does not support IOB2 Scheme");
    }
    return await instance.export(corpusId, iob);
  }
}
