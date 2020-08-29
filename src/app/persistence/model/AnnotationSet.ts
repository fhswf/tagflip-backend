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
import {Annotation} from "./Annotation";
import {HasManyGetAssociationsMixin} from "sequelize";
import {AnnotationSetAttributes} from "@fhswf/tagflip-common";
import {Corpus} from "./Corpus";
import {CorpusAnnotationSets} from "./CorpusAnnotationSets";

@Table({
    tableName: "AnnotationSet"
})
export class AnnotationSet extends Model<AnnotationSet> implements AnnotationSetAttributes{

    @PrimaryKey
    @AutoIncrement
    @Column
    annotationSetId!: number

    @Column
    name!: string;

    @AllowNull
    @Column
    description!: string;

    @HasMany(() => Annotation)
    annotations!: Annotation[];

    @BelongsToMany(() => Corpus, () => CorpusAnnotationSets)
    corpora!: Corpus[];

    @CreatedAt
    @Column
    createdAt!: Date

    @UpdatedAt
    @Column
    updatedAt!: Date

    public getAnnotations!: HasManyGetAssociationsMixin<Annotation>;

}
