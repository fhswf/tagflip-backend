import {
    AllowNull,
    AutoIncrement,
    BelongsToMany,
    Column,
    CreatedAt,
    HasMany,
    Model,
    PrimaryKey,
    Table,
    UpdatedAt
} from 'sequelize-typescript';
import {Document} from "./Document";
import {CorpusAttributes} from "@fhswf/tagflip-common";
import {HasManyAddAssociationMixin, HasManyGetAssociationsMixin, HasManyRemoveAssociationMixin} from "sequelize";
import {AnnotationTask} from "./AnnotationTask";
import {AnnotationSet} from "./AnnotationSet";
import {CorpusAnnotationSets} from "./CorpusAnnotationSets";

@Table(
    {
        tableName: "Corpus"
    }
)
export class Corpus extends Model<Corpus> implements CorpusAttributes{

    @PrimaryKey
    @AutoIncrement
    @Column
    corpusId!: number

    @Column
    name!: string;

    @AllowNull
    @Column
    description!: string;

    @HasMany(() => Document)
    documents!: Document[];

    @BelongsToMany(() => AnnotationSet, () => CorpusAnnotationSets)
    annotationSets!: AnnotationSet[];

    @HasMany(() => AnnotationTask)
    annotationTasks!: AnnotationTask[];

    @CreatedAt
    @Column
    createdAt!: Date

    @UpdatedAt
    @Column
    updatedAt!: Date

    public addAnnotationSet!: HasManyAddAssociationMixin<AnnotationSet, number>;

    public removeAnnotationSet!: HasManyRemoveAssociationMixin<AnnotationSet, number>;

    public getAnnotationSets!: HasManyGetAssociationsMixin<AnnotationSet>;

    public addDocument!: HasManyAddAssociationMixin<Document, number>;

    public getDocuments!: HasManyGetAssociationsMixin<Document>;
}
