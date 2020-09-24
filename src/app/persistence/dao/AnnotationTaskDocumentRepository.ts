import {Singleton} from "typescript-ioc";
import "../index";
import {GenericRepository} from "./GenericRepository";
import {Identifier, Op} from "sequelize";
import {AnnotationTaskDocument} from "../model/AnnotationTaskDocument";
import {Sequelize} from "sequelize-typescript";
import {AnnotationTaskMeta, DocumentAnnotationState} from "@fhswf/tagflip-common";

@Singleton
export class AnnotationTaskDocumentRepository extends GenericRepository<AnnotationTaskDocument>{

    constructor() {
        super(AnnotationTaskDocument);
    }

    public isNew(id: Identifier): boolean {
        return id == null || Number.isNaN(id) || id <= 0;
    }

    public getId(entity: AnnotationTaskDocument): Identifier {
        return entity.annotationTaskDocumentId;
    }

    public async validate(entity: AnnotationTaskDocument): Promise<void | never> {

    }

    public async getAnnotationTaskMeta(annotationTaskId: Identifier) : Promise<AnnotationTaskMeta> {
        let result = await this.repository.findAll({
            group: ['state'],
            attributes: ['state', [Sequelize.fn('COUNT', 'state'), 'count']],
            raw: true,
            where: {'annotationTaskId': {[Op.eq]: annotationTaskId}}
        });

        let meta = {}
        let totalCount = 0;
        for(let entry of result) {
            switch (entry['state']) {
                case DocumentAnnotationState.done:
                    totalCount += (entry as any)['count']
                    Object.assign(meta, {numberOfClosedDocuments: (entry as any)['count']})
                    break;
                case DocumentAnnotationState.open:
                    totalCount += (entry as any)['count']
                    Object.assign(meta, {numberOfOpenDocuments: (entry as any)['count']} )
                    break;
                case DocumentAnnotationState.inprogress:
                    totalCount += (entry as any)['count']
                    break;
            }
        }
        Object.assign(meta, {numberOfDocuments: totalCount})

        return meta;
    }

    public async getByAnnotationTaskIdAndDocumentId(annotationTaskId: number, documentId: number) {
        return await this.repository.findOne({
            where: {
                annotationTaskId,
                documentId
            }
        });
    }

}
