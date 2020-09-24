import {Singleton} from "typescript-ioc";
import "../index";
import {GenericRepository} from "./GenericRepository";
import {FindOptions, Identifier} from "sequelize";
import {Annotation} from "../model/Annotation";
import {ValidationError} from "../../exception/ValidationError";
import * as HttpStatus from "http-status-codes";
import {TagFlipErrorCode} from "@fhswf/tagflip-common";
import {AnnotationTask} from "../model/AnnotationTask";
import {AnnotationTaskState} from "../model/AnnotationTaskState";
import {Errors} from "typescript-rest";
import {ScopeOptions} from "sequelize/types/lib/model";

@Singleton
export class AnnotationTaskStateRepository extends GenericRepository<AnnotationTaskState>{

    constructor() {
        super(AnnotationTaskState);
    }

    public isNew(id: Identifier): boolean {
        return id == null || Number.isNaN(id) || id <= 0;
    }

    public getId(entity: AnnotationTaskState): Identifier {
        return entity.annotationTaskStateId;
    }

    public async validate(entity: AnnotationTaskState): Promise<void | never> {

    }

    public async getByName(name: string, scope: string | ScopeOptions = 'defaultScope'):  Promise<AnnotationTaskState>  {
        let entity = await this.repository.scope(scope).findOne({where: {name}});
        if (!entity) {
            throw new Errors.NotFoundError("No entity for given name.");
        }
        return entity;
    }

}
