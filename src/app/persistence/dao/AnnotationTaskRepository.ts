import {Singleton} from "typescript-ioc";
import "../index";
import {GenericRepository} from "./GenericRepository";
import {Sequelize, Identifier, Op, UpdateOptions} from "sequelize";
import {Annotation} from "../model/Annotation";
import {ValidationError} from "../../exception/ValidationError";
import * as HttpStatus from "http-status-codes";
import {TagFlipErrorCode} from "@fhswf/tagflip-common";
import {AnnotationTask} from "../model/AnnotationTask";

@Singleton
export class AnnotationTaskRepository extends GenericRepository<AnnotationTask> {

    constructor() {
        super(AnnotationTask);
    }

    public isNew(id: Identifier): boolean {
        return id == null || Number.isNaN(id) || id <= 0;
    }

    public getId(entity: AnnotationTask): Identifier {
        return entity.annotationTaskId;
    }

    public async validate(entity: AnnotationTask): Promise<void | never> {

    }

    public decrementPrioritiesAfter(annotationTaskStateId: Identifier, startPriority: number, endPriority?: number) {
        let options : UpdateOptions = {
            where:  {[Op.and]: [{annotationTaskStateId: {[Op.eq]: annotationTaskStateId}},{priority: {[Op.gte]: startPriority}}, {priority: {[Op.lte]: endPriority}}]}
        };
        if (!endPriority) {
            options = {
                where:  {[Op.and]: [{annotationTaskStateId: {[Op.eq]: annotationTaskStateId}},{priority: {[Op.gte]: startPriority}}]}
            }
        }


        this.repository.update({priority: Sequelize.literal('priority - 1')},options);
    }

    public incrementPrioritiesAfter(annotationTaskStateId: Identifier, startPriority: number, endPriority?: number) {
        let options : UpdateOptions = {
            where:  {[Op.and]: [{annotationTaskStateId: {[Op.eq]: annotationTaskStateId}},{priority: {[Op.gte]: startPriority}}, {priority: {[Op.lte]: endPriority}}]}
        };
        if (!endPriority) {
            options = {
                where:  {[Op.and]: [{annotationTaskStateId: {[Op.eq]: annotationTaskStateId}},{priority: {[Op.gte]: startPriority}}]}
            }
        }

        this.repository.update({priority: Sequelize.literal('priority + 1')},options);
    }


}
