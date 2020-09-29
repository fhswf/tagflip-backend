import Parser from "../Parser";
import * as nearley from "nearley";
import grammar, {EntitiesNode} from "./AnnotationConfGrammar"
import {ImportAnnotation} from "../AbstractImporter";
import * as _ from "lodash"

export default class AnnotationConfParser implements Parser<string, ImportAnnotation[]> {

    constructor() {
    }

    parse(value: string): ImportAnnotation[] {
        let parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar))
        value = (value.split("\n").map(x => _.replace(x,/^\s*#.*/, ""))).join("\n") // replace comments with nothing

        parser.feed(value);
        let result = parser.finish();
        if(result[0][0].length === 0)
            return []
        let entitiesNode = undefined;
        for(let section of result[0][0]) {
            if(section instanceof EntitiesNode) {
                entitiesNode = section;
            }
        }
        if(!entitiesNode) {
            throw new Error("Invalid parsing result for annotation config")
        }

        let annotations : ImportAnnotation[] = []
        for(let entity of entitiesNode.entities) {
            annotations.push({
                name: entity.name
            } as ImportAnnotation);
        }
        return annotations
    }

}