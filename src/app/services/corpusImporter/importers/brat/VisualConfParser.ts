import Parser from "../Parser";
import * as nearley from "nearley";
import grammar, {EntityDrawingsNode} from "./VisualConfGrammar"
import * as chroma from "chroma-js";
import {ImportAnnotation} from "../AbstractImporter";
import * as _ from "lodash";

export default class VisualConfParser implements Parser<string, ImportAnnotation[]> {

    constructor() {

    }

    parse(value: string): ImportAnnotation[] {
        let parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar))
        value = (value.split("\n").map(x => _.replace(x,/^\s*#.*/, ""))).join("\n") // replace comments with nothing

        parser.feed(value);
        let result = parser.finish();

        let entityDrawingsNode = undefined;
        if(result.length === 0)
            return []
        if(result[0] instanceof EntityDrawingsNode) {
            entityDrawingsNode = result[0];
        }
        if(!entityDrawingsNode) {
            throw new Error("Invalid parsing result for visual config")
        }

        let annotations : ImportAnnotation[] = []
        for(let entityDrawing of entityDrawingsNode.entityDrawings) {
            let color = chroma.random().hex()
            if(entityDrawing.attributes.has("bgColor")) {
                let attr = entityDrawing.attributes.get("bgColor");
                if(attr)
                    color = chroma(attr.value).hex();
            }
            annotations.push({
                name: entityDrawing.name,
                color: color
            } as ImportAnnotation);
        }
        return annotations
    }

}