import {
    AutoIncrement,
    BelongsTo,
    Column,
    CreatedAt,
    ForeignKey, HasMany,
    Model,
    PrimaryKey,
    Table,
    UpdatedAt
} from 'sequelize-typescript';
import {Document} from "./Document";
import {AnnotationTask} from "./AnnotationTask";
import {AnnotationTaskDocumentAttributes, DocumentAnnotationState} from "@fhswf/tagflip-common";
import {HasManyGetAssociationsMixin} from "sequelize";
import {Tag} from "./Tag";


@Table(
    {
        tableName: "AnnotationTaskDocument"
    }
)
export class AnnotationTaskDocument extends Model<AnnotationTaskDocument> implements AnnotationTaskDocumentAttributes {

    @AutoIncrement
    @PrimaryKey
    @Column
    annotationTaskDocumentId!: number;

    @Column
    @ForeignKey(() => AnnotationTask)
    annotationTaskId!: number;

    @Column
    @ForeignKey(() => Document)
    documentId!: number;

    @Column
    state!: DocumentAnnotationState;

    @CreatedAt
    @Column
    createdAt!: Date

    @UpdatedAt
    @Column
    updatedAt!: Date

    @BelongsTo(() => AnnotationTask)
    annotationTask!: AnnotationTask;

    @BelongsTo(() => Document)
    document!: Document;

}
