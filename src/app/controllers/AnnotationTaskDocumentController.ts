import {GET, Path, PathParam, POST, PUT, QueryParam} from "typescript-rest";
import {Inject} from "typescript-ioc";
import {AnnotationTaskRepository} from "../persistence/dao/AnnotationTaskRepository";
import {AnnotationTask} from "../persistence/model/AnnotationTask";
import {AnnotationTaskDocumentRepository} from "../persistence/dao/AnnotationTaskDocumentRepository";
import {AnnotationTaskDocument} from "../persistence/model/AnnotationTaskDocument";
import {DocumentRepository} from "../persistence/dao/DocumentRepository";
import {Document} from "../persistence/model/Document";
import {DocumentAnnotationState, SearchFilter} from "@fhswf/tagflip-common";
import SearchFilterImpl, {ConvertSearchFilter, SearchFilterParam} from "./decorator/SearchFilter";
import {Op, OrderItem} from "sequelize";
import {sequelize} from "../persistence"

export class AnnotationTaskDocumentController {
    @Inject
    private annotationTaskRepository!: AnnotationTaskRepository;

    @Inject
    private annotationTaskDocumentRepository!: AnnotationTaskDocumentRepository;

    @Inject
    private documentRepository!: DocumentRepository;

    @GET
    @ConvertSearchFilter
    @Path("annotationtask/:annotationTaskId/document")
    public async list(@PathParam("annotationTaskId") annotationTaskId: number,
                      @QueryParam("count") count?: boolean,
                      @QueryParam("offset") offset?: number,
                      @QueryParam("limit")  limit?: number,
                      @QueryParam("sortField")  sortField: string = "annotationTaskDocumentId",
                      @QueryParam("sortOrder")  sortOrder: string = "ASC",
                      @QueryParam("searchFilter") @SearchFilterParam searchFilter?: SearchFilter[]
    ): Promise<AnnotationTaskDocument[] | number> {
        if (count) {
            if (searchFilter) {
                return this.annotationTaskDocumentRepository.count({where: {[Op.and]: [annotationTaskId, searchFilter.map(s => SearchFilterImpl.toSequelize(s))]}})
            }
            return this.annotationTaskDocumentRepository.count({where: {annotationTaskId}});
        }
        let annotationTask = await this.annotationTaskRepository.read(annotationTaskId);
        let options = {limit, offset, order: [[sortField, sortOrder] as OrderItem], include: ['document']}
        if (searchFilter) {
            Object.assign(options, {where: {[Op.and]: searchFilter.map(s => SearchFilterImpl.toSequelize(s))}})
        }

        return annotationTask.getAnnotationTaskDocuments(options);
    }

    @PUT
    @Path("annotationtask/:annotationTaskId/document/:id")
    public async addAnnotationTaskDocument(@PathParam("annotationTaskId") annotationTaskId: number, @PathParam("id") documentId: number): Promise<AnnotationTaskDocument> {
        let annotationTask: AnnotationTask = await this.annotationTaskRepository.read(annotationTaskId)
        let document: Document = await this.documentRepository.read(documentId)
        let result = await this.annotationTaskDocumentRepository.save({
            documentId: document.documentId,
            annotationTaskId: annotationTask.annotationTaskId,
            state: DocumentAnnotationState.open
        } as AnnotationTaskDocument);
        return this.read(result.annotationTaskDocumentId)
    }

    @GET
    @Path("annotationtaskdocument/:id")
    public async read(@PathParam("id") annotationTaskDocumentId: number): Promise<AnnotationTaskDocument> {
        return this.annotationTaskDocumentRepository.read(annotationTaskDocumentId, 'defaultScope', {
            include: [{ model: sequelize.model('Document'), attributes: { exclude: [] } }]
        });
    }

    @PUT
    @Path("annotationtaskdocument")
    public async update(annotationTaskDocument: AnnotationTaskDocument): Promise<AnnotationTaskDocument | null> {
        let result = await this.annotationTaskDocumentRepository.save(annotationTaskDocument);
        return this.read(result.annotationTaskDocumentId)
    }


}
