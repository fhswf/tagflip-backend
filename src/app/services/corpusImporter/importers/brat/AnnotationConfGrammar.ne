# This is a >nearley grammar< for visual.conf from brat-standoff-format
# This file results in TypeScript using CLI-command `nearleyc AnnotationConfGrammar.ne -o AnnotationConfGrammar.ts`
# Note: This grammar does only support a small portion of the whole visual.conf-format and will be extended on demand.

@preprocessor typescript

@{%

export class EntitiesNode {
    entities: EntityNode[]

    constructor(entities : EntityNode[]) {
        this.entities = entities
    }
}

export class EntityNode {
    name: string

    constructor(name:string) {
        this.name = name;
    }
}

const moo = require("moo");

const lexer = moo.states({
    main: {
        commentLine: { match: /^[ \t]*#[^\n]*\n/ },
        emptyLine : { match: /^[ \t]*\n/ , lineBreaks: true},
    
        ws: /[ \t]+/,
        newline: { match: "\n", lineBreaks: true },
        ignoreableSection: { match: /\[labels\]|\[events\]|\[attributes\]|\[relations\]|\[spans\]/, push: 'ignoreableSection' },
        section: { match: /\[[^\n\[\]]+\]/ },
        identifier: { match: /[a-zA-Z0-9_-]+/ },
        string: { match: /[^\n]+/ }
    },
    ignoreableSection : {
        ignoreableContent: { match: /[^\[]+/, lineBreaks: true, pop: 1},
    }
});

lexer.next = (next => () => {
    let tok;

    while ((tok = next.call(lexer)) && ["commentLine", "emptyLine", "ignoreableSection","ignoreableContent"].includes(tok.type)) {/*console.log("Omitting:",tok, tok.type)*/}
    /*console.log("Accepting:", tok)*/
    return tok;
})(lexer.next);


%}

@lexer lexer

Source -> Sections
Sections -> (_ Section _ {% (data) => data[1] %}):* {% (data) => data[0].filter( (d : any) => d !== null) %}

Section -> EntitiesSection  {% (data) => new EntitiesNode(data[0]) %}
            | OtherSection  {% (data) => null %}

EntitiesSection -> EntitiesHeader Entity:* {% (data) => data[1].map( (d : any) => new EntityNode(d.value)) %}
EntitiesHeader -> _ "[entities]" _ %newline
Entity -> _ %identifier _ %newline {% d => d[1] %}

OtherSection -> OtherSectionHeader OtherSectionBlock  {% d => null %}
OtherSectionHeader -> _ ("[relations]" | "[events]" | "[attributes]") _ %newline 
OtherSectionBlock -> null

#mandatory Whitespace
__ -> %ws:+ 

#optional whitespace
_ -> %ws:*