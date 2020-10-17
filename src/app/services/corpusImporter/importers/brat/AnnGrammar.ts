// Generated automatically by nearley, version 2.19.7
// http://github.com/Hardmath123/nearley
// Bypasses TS6133. Allow declared but unused functions.
// @ts-ignore
function id(d: any[]): any { return d[0]; }
declare var textboundAnnotationIdentifier: any;
declare var identifier: any;
declare var number: any;
declare var newline: any;
declare var string: any;
declare var ws: any;


export class TextboundAnnotation {

    id: string

    entity: string

    fromIndex: number

    toIndex: number

    constructor(id: string, entity: string, fromIndex: number, toIndex: number) {
        this.id = id;
        this.entity = entity;
        this.fromIndex = fromIndex;
        this.toIndex = toIndex;
    }
}


const moo = require("moo");

const lexer = moo.states({
    main: {
      ws: /[ \t]+/,
      newline: { match: "\n", lineBreaks: true },
      textboundAnnotationIdentifier: { match: /T[0-9]+/, push: "textboundAnnotationEntry"},
      ignoreableIdentifier: { match: /\s*[REMAN#*][0-9]+|\*/, push: "ignorableEntry"},
    },
    ignorableEntry: {
        ignoreableLine: { match: /[^\n]+\n/, lineBreaks: true, pop: 1}
    },
    textboundAnnotationEntry: {
      number: { match: /[0-9]+/ },
      ws: /[ \t]+/,
      identifier: { match: /[a-zA-Z0-9_-]+/ },
      string: { match: /[^\n]+/ },
      newline: { match: "\n", lineBreaks: true, pop: 1}
    }
});

lexer.next = (next => () => {
    let tok;

    while ((tok = next.call(lexer)) && ["ignoreableIdentifier", "ignoreableLine"].includes(tok.type)) {/*console.log("Omitting:",tok, tok.type)*/}
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
    {"name": "Source", "symbols": ["Lines"], "postprocess": id},
    {"name": "Lines$ebnf$1", "symbols": []},
    {"name": "Lines$ebnf$1", "symbols": ["Lines$ebnf$1", "Line"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "Lines", "symbols": ["Lines$ebnf$1"], "postprocess": id},
    {"name": "Line", "symbols": ["TextboundAnnotationDefinition"], "postprocess": id},
    {"name": "TextboundAnnotationDefinition", "symbols": [(lexer.has("textboundAnnotationIdentifier") ? {type: "textboundAnnotationIdentifier"} : textboundAnnotationIdentifier), "__", (lexer.has("identifier") ? {type: "identifier"} : identifier), "__", (lexer.has("number") ? {type: "number"} : number), "__", (lexer.has("number") ? {type: "number"} : number), "__", "Tokens", (lexer.has("newline") ? {type: "newline"} : newline)], "postprocess": d => new TextboundAnnotation(d[0].value, d[2].value, Number.parseInt(d[4]), Number.parseInt(d[6]))},
    {"name": "Tokens$ebnf$1", "symbols": []},
    {"name": "Tokens$ebnf$1", "symbols": ["Tokens$ebnf$1", "Token"], "postprocess": (d) => d[0].concat([d[1]])},
    {"name": "Tokens", "symbols": ["Tokens$ebnf$1"]},
    {"name": "Token$subexpression$1", "symbols": [(lexer.has("string") ? {type: "string"} : string)]},
    {"name": "Token$subexpression$1", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)]},
    {"name": "Token$subexpression$1", "symbols": [(lexer.has("number") ? {type: "number"} : number)]},
    {"name": "Token$subexpression$1", "symbols": [(lexer.has("newline") ? {type: "newline"} : newline)]},
    {"name": "Token$subexpression$1", "symbols": ["__"]},
    {"name": "Token", "symbols": ["Token$subexpression$1"]},
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
