// Generated automatically by nearley, version 2.19.7
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
function id(d: any[]): any { return d[0]; }
declare var sectionDrawingsBegin: any;
declare var newline: any;
declare var identifier: any;
declare var commaSeperator: any;
declare var colorString: any;
declare var nonCommaString: any;
declare var dashArrayString: any;
declare var sectionLabelsBegin: any;
declare var ws: any;


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



interface NearleyToken {  value: any;
  [key: string]: any;
};

interface NearleyLexer {
  reset: (chunk: string, info: any) => void;
  next: () => NearleyToken | undefined;
  save: () => any;
  formatError: (token: NearleyToken) => string;
  has: (tokenType: string) => boolean;
};

interface NearleyRule {
  name: string;
  symbols: NearleySymbol[];
  postprocess?: (d: any[], loc?: number, reject?: {}) => any;
};

type NearleySymbol = string | { literal: any } | { test: (token: any) => boolean };

interface Grammar {
  Lexer: NearleyLexer | undefined;
  ParserRules: NearleyRule[];
  ParserStart: string;
};

const grammar: Grammar = {
  Lexer: lexer,
  ParserRules: [
    {"name": "Source", "symbols": ["LabelsSection", "DrawingSection"], "postprocess": (data) => data[1]},
    {"name": "Source", "symbols": ["DrawingSection", "LabelsSection"], "postprocess": (data) => data[0]},
    {"name": "DrawingSection$ebnf$1", "symbols": []},
    {"name": "DrawingSection$ebnf$1", "symbols": ["DrawingSection$ebnf$1", "DrawingDefinition"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "DrawingSection", "symbols": ["DrawingHeader", "DrawingSection$ebnf$1"], "postprocess": ([header, definitions]) => new EntityDrawingsNode(definitions)},
    {"name": "DrawingHeader", "symbols": ["_", (lexer.has("sectionDrawingsBegin") ? {type: "sectionDrawingsBegin"} : sectionDrawingsBegin), "_", (lexer.has("newline") ? {type: "newline"} : newline)]},
    {"name": "DrawingDefinition", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier), "__", "EntityVisualList", "_", (lexer.has("newline") ? {type: "newline"} : newline)], "postprocess": ([identifier, _, definitions]) => new EntityDrawingNode(identifier.value, definitions.filter((x : any) => x !== null))},
    {"name": "EntityVisualList", "symbols": ["VisualDefinition"], "postprocess": (def) => [def[0]]},
    {"name": "EntityVisualList", "symbols": ["EntityVisualList", (lexer.has("commaSeperator") ? {type: "commaSeperator"} : commaSeperator), "VisualDefinition"], "postprocess": ([list, _, def]) => [...list, def]},
    {"name": "VisualDefinition$subexpression$1", "symbols": [(lexer.has("colorString") ? {type: "colorString"} : colorString)]},
    {"name": "VisualDefinition$subexpression$1", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)]},
    {"name": "VisualDefinition", "symbols": [{"literal":"bgColor:"}, "VisualDefinition$subexpression$1"], "postprocess": (data) => new EntityDrawingAttribute(data[0].value, data[1][0].value)},
    {"name": "VisualDefinition$subexpression$2", "symbols": [(lexer.has("colorString") ? {type: "colorString"} : colorString)]},
    {"name": "VisualDefinition$subexpression$2", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)]},
    {"name": "VisualDefinition", "symbols": [{"literal":"fgColor:"}, "VisualDefinition$subexpression$2"], "postprocess": (data) => null},
    {"name": "VisualDefinition$subexpression$3", "symbols": [(lexer.has("colorString") ? {type: "colorString"} : colorString)]},
    {"name": "VisualDefinition$subexpression$3", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)]},
    {"name": "VisualDefinition", "symbols": [{"literal":"borderColor:"}, "VisualDefinition$subexpression$3"], "postprocess": (data) => null},
    {"name": "VisualDefinition$subexpression$4", "symbols": [(lexer.has("colorString") ? {type: "colorString"} : colorString)]},
    {"name": "VisualDefinition$subexpression$4", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)]},
    {"name": "VisualDefinition", "symbols": [{"literal":"color:"}, "VisualDefinition$subexpression$4"], "postprocess": (data) => null},
    {"name": "VisualDefinition$subexpression$5", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)]},
    {"name": "VisualDefinition$subexpression$5", "symbols": [(lexer.has("nonCommaString") ? {type: "nonCommaString"} : nonCommaString)]},
    {"name": "VisualDefinition", "symbols": [{"literal":"labelArrow:"}, "VisualDefinition$subexpression$5"], "postprocess": (data) => null},
    {"name": "VisualDefinition$subexpression$6", "symbols": [(lexer.has("dashArrayString") ? {type: "dashArrayString"} : dashArrayString)]},
    {"name": "VisualDefinition$subexpression$6", "symbols": [(lexer.has("nonCommaString") ? {type: "nonCommaString"} : nonCommaString)]},
    {"name": "VisualDefinition", "symbols": [{"literal":"dashArray:"}, "VisualDefinition$subexpression$6"], "postprocess": (data) => null},
    {"name": "VisualDefinition$subexpression$7", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)]},
    {"name": "VisualDefinition$subexpression$7", "symbols": [(lexer.has("nonCommaString") ? {type: "nonCommaString"} : nonCommaString)]},
    {"name": "VisualDefinition", "symbols": [{"literal":"arrowHead:"}, "VisualDefinition$subexpression$7"], "postprocess": (data) => null},
    {"name": "VisualDefinition$subexpression$8", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)]},
    {"name": "VisualDefinition$subexpression$8", "symbols": [(lexer.has("nonCommaString") ? {type: "nonCommaString"} : nonCommaString)]},
    {"name": "VisualDefinition", "symbols": [{"literal":"glyph:"}, "VisualDefinition$subexpression$8"], "postprocess": (data) => null},
    {"name": "VisualDefinition$subexpression$9", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)]},
    {"name": "VisualDefinition$subexpression$9", "symbols": [(lexer.has("nonCommaString") ? {type: "nonCommaString"} : nonCommaString)]},
    {"name": "VisualDefinition", "symbols": [{"literal":"box:"}, "VisualDefinition$subexpression$9"], "postprocess": (data) => null},
    {"name": "LabelsSection", "symbols": ["LabelsSectionHeader", "LabelSectionBlock"], "postprocess": d => null},
    {"name": "LabelsSectionHeader", "symbols": ["_", (lexer.has("sectionLabelsBegin") ? {type: "sectionLabelsBegin"} : sectionLabelsBegin)]},
    {"name": "LabelSectionBlock", "symbols": []},
    {"name": "__$ebnf$1", "symbols": [(lexer.has("ws") ? {type: "ws"} : ws)]},
    {"name": "__$ebnf$1", "symbols": ["__$ebnf$1", (lexer.has("ws") ? {type: "ws"} : ws)], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "__", "symbols": ["__$ebnf$1"]},
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", (lexer.has("ws") ? {type: "ws"} : ws)], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "_", "symbols": ["_$ebnf$1"]}
  ],
  ParserStart: "Source",
};

export default grammar;
