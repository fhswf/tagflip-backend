import {Column, CreatedAt, ForeignKey, Model, Table, UpdatedAt} from 'sequelize-typescript';
import {AnnotationSet} from "./AnnotationSet";
import {Corpus} from "./Corpus";

@Table(
    {
        tableName: "CorpusAnnotationSets"
    }
)
export class CorpusAnnotationSets extends Model<CorpusAnnotationSets> {

    @Column
    @ForeignKey(() => Corpus)
    corpusId!: number;

    @Column
    @ForeignKey(() => AnnotationSet)
    annotationSetId!: number;

    @CreatedAt
    @Column
    createdAt!: Date

    @UpdatedAt
    @Column
    updatedAt!: Date
}
