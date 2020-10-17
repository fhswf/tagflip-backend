import Parser from "../Parser";
import * as nearley from "nearley";
import grammar, {TextboundAnnotation} from "./AnnGrammar"
import {ImportAnnotation, ImportTag} from "../AbstractImporter";
import * as chroma from "chroma-js"

export default class AnnParser implements Parser<string, ImportTag[]> {

    private knownAnnotations :  Map<string, ImportAnnotation>;

    constructor(knownAnnotations : Map<string, ImportAnnotation>) {
        this.knownAnnotations = knownAnnotations;
        if(!knownAnnotations) {
            this.knownAnnotations = new Map();
        }
    }

    parse(value: string): ImportTag[] {
        let parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar))

        parser.feed(value);
        let result = parser.finish();

        let importTags : ImportTag[] = []
        for(let entry of result[0].filter((x : any) => x instanceof TextboundAnnotation)) {
            let t : TextboundAnnotation = entry

            let annotation : ImportAnnotation;
            if(this.knownAnnotations.has(t.entity)) {
                // @ts-ignore
                annotation = this.knownAnnotations.get(t.entity);
            } else {
                annotation = {
                    name: t.entity,
                    color: chroma.random().hex()
                }
                this.knownAnnotations.set(annotation.name, annotation)
            }

            let tag : ImportTag = {
                fromIndex: t.fromIndex,
                toIndex: t.toIndex,
                annotation: annotation
            }
            importTags.push(tag)
        }

        return importTags;
    }

}