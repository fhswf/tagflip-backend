import {
    DELETE,
    FilesParam,
    FormParam,
    GET,
    IgnoreNextMiddlewares,
    Path,
    PathParam,
    POST,
    PUT,
    QueryParam, Return
} from "typescript-rest";
import { Corpus } from "../persistence/model/Corpus";
import { CorpusRepository } from "../persistence/dao/CorpusRepository";
import { Inject } from "typescript-ioc";
import SearchFilter, { ConvertSearchFilter, SearchFilterParam } from "./decorator/SearchFilter";
import { Op, OrderItem } from "sequelize";
import { AnnotationSet } from "../persistence/model/AnnotationSet";
import { AnnotationSetRepository } from "../persistence/dao/AnnotationSetRepository";
import AbstractImporter from "../services/corpusImporter/importers";
import { BeginTransaction } from "../persistence/decorator/Transaction";
import { BadRequestError, NotFoundError } from "typescript-rest/dist/server/model/errors";
import { AnnotatedCorpusImportService } from "../services/corpusImporter";
import AbstractExporter from "../services/corpusExporter/exporters/AbstractExporter";
import AnnotatedCorpusExportService from "../services/corpusExporter/AnnotatedCorpusExportService";
import dateFormat = require("dateformat");

@Path("corpus")
export class CorpusController {

    @Inject
    private corpusRepository!: CorpusRepository

    @Inject
    private annotationSetRepository!: AnnotationSetRepository

    @Inject
    private annotatedCorpusImportService!: AnnotatedCorpusImportService;

    @Inject
    private annotatedCorpusExportService!: AnnotatedCorpusExportService;

    @Path("/import")
    @GET
    @IgnoreNextMiddlewares
    public async importerTypes(): Promise<string[]> {
        return AbstractImporter.getImporterNames();
    }

    @Path("/import")
    @POST
    @BeginTransaction
    public async import(
        @FormParam("importer") importer: string,
        @FormParam("corpusName") corpusName: string,
        @FormParam("annotationSetName") annotationSetName: string,
        @FilesParam("files") files: Express.Multer.File[]): Promise<Corpus> {
        if (!files || files.length == 0) {
            throw new BadRequestError("no files were uploaded")
        }
        if (!corpusName) {
            throw new BadRequestError("no Corpus name specified")
        }
        if (!annotationSetName) {
            throw new BadRequestError("no Annotation Set name specified")
        }
        return await this.annotatedCorpusImportService.import(importer, corpusName, annotationSetName, files);
    }

    @Path("/export")
    @GET
    @IgnoreNextMiddlewares
    public async exportTypes(): Promise<string[]> {
        return AbstractExporter.getExporterNames();
    }

    @Path(":corpusId/export")
    @GET
    public async export(
        @PathParam("corpusId") corpusId: number,
        @QueryParam("exporterName") exporterName: string): Promise<Return.DownloadBinaryData> {
        if (!exporterName)
            throw new BadRequestError("Exporter is not defined.")
        return new Return.DownloadBinaryData(await this.annotatedCorpusExportService.export(exporterName, corpusId), 'application/zip', `export-corpus-${corpusId}_${dateFormat("yyyymmdd_HHMMss")}.zip`);
    }


    @GET
    @ConvertSearchFilter
    public async list(@QueryParam("count") count?: boolean,
        @QueryParam("offset") offset?: number,
        @QueryParam("limit") limit?: number,
        @QueryParam("sortField") sortField = "corpusId",
        @QueryParam("sortOrder") sortOrder = "ASC",
        @QueryParam("searchFilter") @SearchFilterParam searchFilter?: SearchFilter[]): Promise<Corpus[] | number> {
        if (count) {
            if (searchFilter) {
                return this.corpusRepository.count({ where: { [Op.and]: [searchFilter.map(s => SearchFilter.toSequelize(s))] } })
            }
            return this.corpusRepository.count();
        }

        const options = { limit, offset, order: [[sortField, sortOrder] as OrderItem] }
        if (searchFilter) {
            Object.assign(options, { where: { [Op.and]: searchFilter.map(s => SearchFilter.toSequelize(s)) } })
        }

        return this.corpusRepository.list(options);
    }

    @Path(":id")
    @GET
    public async read(@PathParam("id") corpusId: number): Promise<Corpus> {
        return this.corpusRepository.read(corpusId);
    }

    @POST
    public async create(corpus: Corpus): Promise<Corpus> {
        const newCorpus = await this.corpusRepository.save(corpus);
        if (corpus.annotationSets) {
            for (const annotationSet of corpus.annotationSets) {
                void newCorpus.addAnnotationSet(this.annotationSetRepository.build(annotationSet))
            }
        }

        return newCorpus;
    }

    @PUT
    public async update(corpus: Corpus): Promise<Corpus | null> {
        return this.corpusRepository.save(corpus);
    }

    @Path(":id")
    @DELETE
    public async delete(@PathParam("id") corpusId: number): Promise<void> {
        await this.corpusRepository.delete(corpusId);
    }

    @Path(":corpusId/annotationset")
    @GET
    public async listAnnotationSets(@PathParam("corpusId") corpusId: number): Promise<AnnotationSet[]> {
        const corpus = await this.corpusRepository.read(corpusId);
        return corpus.getAnnotationSets();
    }


    @Path(":corpusId/annotationset/:annotationSetId")
    @PUT
    public async addAnnotationSet(@PathParam("corpusId") corpusId: number, @PathParam("annotationSetId") annotationSetId: number): Promise<void> {
        const corpus = await this.corpusRepository.read(corpusId);
        const annotationSet = await this.annotationSetRepository.read(annotationSetId);
        void corpus.addAnnotationSet(annotationSet)
    }

    @Path(":corpusId/annotationset/:annotationSetId")
    @DELETE
    public async removeAnnotationSet(@PathParam("corpusId") corpusId: number, @PathParam("annotationSetId") annotationSetId: number): Promise<void> {
        const corpus = await this.corpusRepository.read(corpusId);
        const annotationSet = await this.annotationSetRepository.read(annotationSetId);
        void corpus.removeAnnotationSet(annotationSet)
    }



}
