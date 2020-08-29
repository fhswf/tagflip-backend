import {DELETE, GET, Path, PathParam, POST, PUT, QueryParam} from "typescript-rest";
import {Inject} from "typescript-ioc";
import {AnnotationSet} from "../persistence/model/AnnotationSet";
import {AnnotationSetRepository} from "../persistence/dao/AnnotationSetRepository";
import SearchFilter, {ConvertSearchFilter, SearchFilterParam} from "./decorator/SearchFilter";
import {Op, OrderItem} from "sequelize";

@Path("annotationset")
export class AnnotationSetController {

    @Inject
    private annotationSetRepository!: AnnotationSetRepository

    @GET
    @ConvertSearchFilter
    public async list(@QueryParam("count") count?: boolean,
                      @QueryParam("offset") offset?: number,
                      @QueryParam("limit")  limit?: number,
                      @QueryParam("sortField")  sortField: string = "annotationSetId",
                      @QueryParam("sortOrder")  sortOrder: string = "ASC",
                      @QueryParam("searchFilter") @SearchFilterParam searchFilter?: SearchFilter[]): Promise<AnnotationSet[] | number> {
        if (count) {
            if (searchFilter) {
                return this.annotationSetRepository.count({where: {[Op.and]: [searchFilter.map(s => SearchFilter.toSequelize(s))]}})
            }
            return this.annotationSetRepository.count();
        }

        let options = {limit, offset, order: [[sortField, sortOrder] as OrderItem]}
        if (searchFilter) {
            Object.assign(options, {where: {[Op.and]: searchFilter.map(s => SearchFilter.toSequelize(s))}})
        }

        return this.annotationSetRepository.list(options);
    }

    @Path(":id")
    @GET
    public async read(@PathParam("id") annotationSetId: number): Promise<AnnotationSet> {
        return this.annotationSetRepository.read(annotationSetId);
    }

    @POST
    public async create(annotationSet: AnnotationSet): Promise<AnnotationSet> {
        return this.annotationSetRepository.save(annotationSet);
    }

    @PUT
    public async update(annotationSet: AnnotationSet): Promise<AnnotationSet | null> {
        return this.annotationSetRepository.save(annotationSet);
    }

    @Path(":id")
    @DELETE
    public async delete(@PathParam("id") annotationSetId: number): Promise<void> {
        await this.annotationSetRepository.delete(annotationSetId);
    }

}
