import {AutoIncrement, Column, ForeignKey, Model, PrimaryKey, Table, UpdatedAt, CreatedAt} from 'sequelize-typescript';
import {AnnotationTaskStateAttributes} from "@fhswf/tagflip-common"

@Table(
    {
        tableName: "AnnotationTaskState"
    }
)
export class AnnotationTaskState extends Model<AnnotationTaskState> implements AnnotationTaskStateAttributes {

    @AutoIncrement
    @PrimaryKey
    @Column
    annotationTaskStateId!: number;

    @Column
    name!: string;

    @Column
    color!: string;

    @Column
    visible!: boolean;

    @UpdatedAt
    @Column
    updatedAt!: Date

    @CreatedAt
    @Column
    createdAt!: Date

}
