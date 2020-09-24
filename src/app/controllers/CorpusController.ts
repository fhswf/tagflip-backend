import {DELETE, GET, Path, PathParam, POST, PUT, QueryParam} from "typescript-rest";
import {Corpus} from "../persistence/model/Corpus";
import {CorpusRepository} from "../persistence/dao/CorpusRepository";
import {Inject} from "typescript-ioc";
import SearchFilter, {ConvertSearchFilter, SearchFilterParam} from "./decorator/SearchFilter";
import {Op, OrderItem} from "sequelize";
import {AnnotationSet} from "../persistence/model/AnnotationSet";
import {AnnotationSetRepository} from "../persistence/dao/AnnotationSetRepository";

@Path("corpus")
export class CorpusController {

    @Inject
    private corpusRepository!: CorpusRepository

    @Inject
    private annotationSetRepository!: AnnotationSetRepository

    @GET
    @ConvertSearchFilter
    public async list(@QueryParam("count") count?: boolean,
                      @QueryParam("offset") offset?: number,
                      @QueryParam("limit")  limit?: number,
                      @QueryParam("sortField")  sortField: string = "corpusId",
                      @QueryParam("sortOrder")  sortOrder: string = "ASC",
                      @QueryParam("searchFilter") @SearchFilterParam searchFilter?: SearchFilter[]): Promise<Corpus[] | number> {
        if (count) {
            if (searchFilter) {
                return this.corpusRepository.count({where: {[Op.and]: [searchFilter.map(s => SearchFilter.toSequelize(s))]}})
            }
            return this.corpusRepository.count();
        }

        let options = {limit, offset, order: [[sortField, sortOrder] as OrderItem]}
        if (searchFilter) {
            Object.assign(options, {where: {[Op.and]: searchFilter.map(s => SearchFilter.toSequelize(s))}})
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
        let newCorpus = await this.corpusRepository.save(corpus);
        if (corpus.annotationSets) {
            for (const annotationSet of corpus.annotationSets) {
                newCorpus.addAnnotationSet(this.annotationSetRepository.build(annotationSet))
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
        let corpus = await this.corpusRepository.read(corpusId);
        return corpus.getAnnotationSets();
    }


    @Path(":corpusId/annotationset/:annotationSetId")
    @PUT
    public async addAnnotationSet(@PathParam("corpusId") corpusId: number, @PathParam("annotationSetId") annotationSetId: number): Promise<void> {
        let corpus = await this.corpusRepository.read(corpusId);
        let annotationSet = await this.annotationSetRepository.read(annotationSetId);
        corpus.addAnnotationSet(annotationSet)
    }

    @Path(":corpusId/annotationset/:annotationSetId")
    @DELETE
    public async removeAnnotationSet(@PathParam("corpusId") corpusId: number, @PathParam("annotationSetId") annotationSetId: number): Promise<void> {
        let corpus = await this.corpusRepository.read(corpusId);
        let annotationSet = await this.annotationSetRepository.read(annotationSetId);
        corpus.removeAnnotationSet(annotationSet)
    }

}
