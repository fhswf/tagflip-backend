import {
    AllowNull,
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
import {AnnotationTaskAttributes} from "@fhswf/tagflip-common"
import {Corpus} from "./Corpus";
import {HasManyAddAssociationMixin, HasManyGetAssociationsMixin} from "sequelize";
import {Document} from "./Document";
import {AnnotationTaskDocument} from "./AnnotationTaskDocument";
import {AnnotationTaskState} from "./AnnotationTaskState";

@Table(
    {
        tableName: "AnnotationTask"
    }
)
export class AnnotationTask extends Model<AnnotationTask> implements AnnotationTaskAttributes {

    @AutoIncrement
    @PrimaryKey
    @Column
    annotationTaskId!: number;

    @Column
    @ForeignKey(() => Corpus)
    corpusId!: number;

    @Column
    name!: string;

    @AllowNull
    @Column
    description!: string;

    @ForeignKey(() => AnnotationTaskState)
    annotationTaskStateId!: number;

    @Column
    priority!:number

    @CreatedAt
    @Column
    createdAt!: Date

    @UpdatedAt
    @Column
    updatedAt!: Date

    @BelongsTo(() => Corpus)
    corpus!: Corpus;

    @BelongsTo(() => AnnotationTaskState)
    annotationTaskState!: AnnotationTaskState;

    @HasMany(() => AnnotationTaskDocument)
    annotationTaskDocuments!: AnnotationTaskDocument;

    public addAnnotationTaskDocument!: HasManyAddAssociationMixin<AnnotationTaskDocument, number>;

    public getAnnotationTaskDocuments!: HasManyGetAssociationsMixin<AnnotationTaskDocument>;

}
