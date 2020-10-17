import {
    AllowNull,
    AutoIncrement, BelongsTo,
    Column,
    CreatedAt,
    ForeignKey,
    Model,
    PrimaryKey,
    Table,
    UpdatedAt
} from "sequelize-typescript";
import {TagAttributes} from "@fhswf/tagflip-common";
import {Annotation} from "./Annotation";
import {Document} from "./Document";
import {AnnotationTask} from "./AnnotationTask";

@Table({
    tableName:"Tag"
})
export class Tag extends Model<Tag> implements TagAttributes{

    @PrimaryKey
    @AutoIncrement
    @Column
    tagId!: number

    @ForeignKey(() => Annotation)
    @Column
    annotationId!: number;

    @ForeignKey(() => Document)
    @Column
    documentId!: number;

    @ForeignKey(() => AnnotationTask)
    @AllowNull
    @Column
    annotationTaskId!: number;

    @Column
    startIndex!: number;

    @Column
    endIndex!: number;

    @CreatedAt
    @Column
    createdAt!: Date

    @UpdatedAt
    @Column
    updatedAt!: Date

    @BelongsTo(() => Annotation)
    annotation!: Annotation;

}
