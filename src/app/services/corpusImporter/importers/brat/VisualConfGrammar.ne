# This is a >nearley grammar< for annotation.conf from brat-standoff-format
# This file results in TypeScript using CLI-command `nearleyc VisualConfGrammar.ne -o VisualConfGrammar.ts`
# Note: This grammar does only support a small portion of the whole annotation.conf-format and will be extended on demand.

@preprocessor typescript

@{%

export class EntityDrawingsNode {
    entityDrawings: EntityDrawingNode[]

    constructor(entityDrawings : EntityDrawingNode[]) {
        this.entityDrawings = entityDrawings
    }
}

export class EntityDrawingNode {

    name: string

    attributes: Map<string, EntityDrawingAttribute>

    constructor(name:string, attributes:EntityDrawingAttribute[]) {
        this.name = name;
        this.attributes = new Map();
        for(let attr of attributes) {
            this.attributes.set(attr.name, attr)
        }
    }
}

export class EntityDrawingAttribute {

    name: string

    value: string

    constructor(name:string, value:string) {
        this.name = name;
        this.value = value;
    }
}

const moo = require("moo");

const lexer = moo.states({
    main: {
        commentLine: { match: /^[ \t]*#[^\n]*\n/ },
        emptyLine : { match: /^[ \t]*\n/ , lineBreaks: true},
        ws: /[ \t]+/,
        newline: { match: "\n", lineBreaks: true },
        sectionLabelsBegin: { match: /\[labels\]/, push: 'labels' },
        sectionDrawingsBegin: { match: /\[drawing\]/ },

        commaSeperator: { match: /[ \t]*,[ \t]*/ },
        dashArrayString: { match: /(?:[0-9]+-)+[0-9]|[0-9]+|-/ },
        attributeKey: { match: /[a-zA-Z0-9\_\-]+:/, value: (key : string) => key.slice(0,-1)},
        identifier: { match: /[a-zA-Z0-9_-]+/ },
        colorString: { match: /#[a-fA-F0-9]{3,6}/ },
        nonCommaString: { match: /[^\n \t,;]+/ },
        string: { match: /[^\n]+/ }
    },
    labels: {
        labelData: { match: /[^\[]+/, lineBreaks: true, pop: 1},
    }
});

lexer.next = (next => () => {
    let tok;

    while ((tok = next.call(lexer)) && ["commentLine", "emptyLine", "labelData"].includes(tok.type)) {/*console.log("Omitting:",tok, tok.type)*/}
    //console.log("Accepting:", tok)
    return tok;
})(lexer.next);


%}

@lexer lexer

Source -> LabelsSection DrawingSection          {% (data) => data[1] %}
        | DrawingSection LabelsSection          {% (data) => data[0] %}


DrawingSection -> DrawingHeader DrawingDefinition:*                        {% ([header, definitions]) => new EntityDrawingsNode(definitions) %}
DrawingHeader -> _ %sectionDrawingsBegin _ %newline
DrawingDefinition -> %identifier __ EntityVisualList _ %newline            {% ([identifier, _, definitions]) => new EntityDrawingNode(identifier.value, definitions.filter((x : any) => x !== null)) %}

EntityVisualList -> VisualDefinition                                       {% (def) => [def[0]] %}
                    | EntityVisualList %commaSeperator VisualDefinition    {% ([list, _, def]) => [...list, def] %}

VisualDefinition ->  "bgColor:" (%colorString | %identifier)                                {% (data) => new EntityDrawingAttribute(data[0].value, data[1][0].value) %} # Access colorString or identifier
                    | "fgColor:" (%colorString | %identifier)                               {% (data) => null %}
                    | "borderColor:" (%colorString | %identifier)                           {% (data) => null %}
                    | "color:" (%colorString | %identifier)                                 {% (data) => null %}
                    | "labelArrow:" (%identifier | %nonCommaString)                         {% (data) => null %}
                    | "dashArray:" (%dashArrayString | %nonCommaString)                     {% (data) => null %}
                    | "arrowHead:" (%identifier | %nonCommaString)                          {% (data) => null %}
                    | "glyph:" (%identifier | %nonCommaString)                              {% (data) => null %}
                    | "box:"  (%identifier | %nonCommaString)                               {% (data) => null %}

LabelsSection -> LabelsSectionHeader LabelSectionBlock  {% d => null %}
LabelsSectionHeader -> _ %sectionLabelsBegin
LabelSectionBlock -> null           # Only epsilon rule for now - no further definition. Labels are omitted by lexer for now

#mandatory Whitespace
__ -> %ws:+ 

#optional whitespace
_ -> %ws:*