import { Operator, SearchFilter } from "@fhswf/tagflip-common";
import { Op, WhereAttributeHash } from "sequelize";

export const SEARCH_QUERY_PARAMETER = "SEARCH_QUERY_PARAMETER"


const SearchFilterParam = <O>(target: O, propertyKey: string, parameterIndex: number): void => {
    const existingSearchFilters: number[] =
        <number[]>Reflect.getOwnMetadata(SEARCH_QUERY_PARAMETER, target, propertyKey) || [];
    existingSearchFilters.push(parameterIndex)
    Reflect.defineMetadata(
        SEARCH_QUERY_PARAMETER,
        existingSearchFilters,
        target,
        propertyKey
    );
}

//type TargetType<S> = (args: any[]) => S;

const ConvertSearchFilter = <O, S>(
    target: O,
    propertyKey: string,
    descriptor: PropertyDescriptor
): void => {
    const parameterIndices = <number[]>Reflect.getMetadata(SEARCH_QUERY_PARAMETER, target, propertyKey)
    const method = <(...args: any[]) => S>descriptor.value
    descriptor.value = (...args: any[]): (S | undefined) => {
        for (const index of parameterIndices) {
            if (args[index])
                args[index] = SearchFilterImpl.ofJson(args[index])
        }
        if (method) {
            return method.apply(this, args)
        }
    }
}

export { SearchFilterParam, ConvertSearchFilter }

export default class SearchFilterImpl implements SearchFilter {

    field!: string;
    filterValue!: string | number | boolean;
    operator!: Operator;

    constructor(filter: SearchFilter) {
        this.field = filter.field;
        this.filterValue = <string | number | boolean>filter.filterValue;
        this.operator = filter.operator;
    }

    public static ofJson(json: string): SearchFilter | SearchFilter[] {
        const object = <SearchFilter>JSON.parse(json);
        if (Array.isArray(object)) {
            const filters = []
            for (const elem of object) {
                filters.push(new SearchFilterImpl(elem as SearchFilter))
            }
            return filters;
        }
        else {
            return new SearchFilterImpl(object)
        }
    }

    public static toSequelize(searchFilter: SearchFilter): WhereAttributeHash {
        switch (searchFilter.operator) {
            case Operator.STARTS_WITH:
                return { [searchFilter.field]: { [Op.startsWith]: <string>searchFilter.filterValue } }
            case Operator.SUBSTRING:
                return { [searchFilter.field]: { [Op.substring]: <string>searchFilter.filterValue } }
            default:
                throw Error("Filter Operation not supported.")
        }
    }
}
