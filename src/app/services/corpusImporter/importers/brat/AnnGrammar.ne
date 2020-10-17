# This is a >nearley grammar< for annotation.conf from brat-standoff-format
# This file results in TypeScript using CLI-command `nearleyc AnnGrammar.ne -o AnnGrammar.ts`
# Note: This grammar does only support a small portion of the whole annotation.conf-format and will be extended on demand.

@preprocessor typescript

@{%

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


%}

@lexer lexer

Source -> Lines                            {% id %}
Lines -> Line:*                         {% id %}
Line -> TextboundAnnotationDefinition   {% id %}

TextboundAnnotationDefinition -> %textboundAnnotationIdentifier __ %identifier __ %number __ %number __ Tokens %newline {% d => new TextboundAnnotation(d[0].value, d[2].value, Number.parseInt(d[4]), Number.parseInt(d[6])) %}
Tokens -> Token:*                
Token -> (%string | %identifier | %number | %newline | __)   


#mandatory Whitespace
__ -> %ws:+ 

#optional whitespace
_ -> %ws:*