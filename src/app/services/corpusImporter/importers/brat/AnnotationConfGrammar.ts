// Generated automatically by nearley, version 2.19.7
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
function id(d: any[]): any { return d[0]; }
declare var newline: any;
declare var identifier: any;
declare var ws: any;


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
    {"name": "Source", "symbols": ["Sections"]},
    {"name": "Sections$ebnf$1", "symbols": []},
    {"name": "Sections$ebnf$1$subexpression$1", "symbols": ["_", "Section", "_"], "postprocess": (data) => data[1]},
    {"name": "Sections$ebnf$1", "symbols": ["Sections$ebnf$1", "Sections$ebnf$1$subexpression$1"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "Sections", "symbols": ["Sections$ebnf$1"], "postprocess": (data) => data[0].filter( (d : any) => d !== null)},
    {"name": "Section", "symbols": ["EntitiesSection"], "postprocess": (data) => new EntitiesNode(data[0])},
    {"name": "Section", "symbols": ["OtherSection"], "postprocess": (data) => null},
    {"name": "EntitiesSection$ebnf$1", "symbols": []},
    {"name": "EntitiesSection$ebnf$1", "symbols": ["EntitiesSection$ebnf$1", "Entity"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "EntitiesSection", "symbols": ["EntitiesHeader", "EntitiesSection$ebnf$1"], "postprocess": (data) => data[1].map( (d : any) => new EntityNode(d.value))},
    {"name": "EntitiesHeader", "symbols": ["_", {"literal":"[entities]"}, "_", (lexer.has("newline") ? {type: "newline"} : newline)]},
    {"name": "Entity", "symbols": ["_", (lexer.has("identifier") ? {type: "identifier"} : identifier), "_", (lexer.has("newline") ? {type: "newline"} : newline)], "postprocess": d => d[1]},
    {"name": "OtherSection", "symbols": ["OtherSectionHeader", "OtherSectionBlock"], "postprocess": d => null},
    {"name": "OtherSectionHeader$subexpression$1", "symbols": [{"literal":"[relations]"}]},
    {"name": "OtherSectionHeader$subexpression$1", "symbols": [{"literal":"[events]"}]},
    {"name": "OtherSectionHeader$subexpression$1", "symbols": [{"literal":"[attributes]"}]},
    {"name": "OtherSectionHeader", "symbols": ["_", "OtherSectionHeader$subexpression$1", "_", (lexer.has("newline") ? {type: "newline"} : newline)]},
    {"name": "OtherSectionBlock", "symbols": []},
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
