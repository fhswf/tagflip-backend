import { expect } from 'chai';
import 'mocha';
import * as fs from "fs";
import {PathLike} from "fs";
import {CompiledRules} from "nearley";
import * as ts from "typescript";
import * as path from "path";

const parserForSource = async (path: PathLike): Promise<nearley.Parser> => {
    const nearley = require("nearley");
    const compile = require("nearley/lib/compile");
    const generate = require("nearley/lib/generate");
    const nearleyGrammar = require("nearley/lib/nearley-language-bootstrapped");

    let sourceCode = fs.readFileSync(path).toString()

    // Parse the grammar source into an AST
    const grammarParser = new nearley.Parser(nearleyGrammar);
    grammarParser.feed(sourceCode);
    const grammarAst = grammarParser.results[0]; // TODO check for errors

    // Compile the AST into a set of rules
    const grammarInfoObject = compile(grammarAst, {});


    // Generate JavaScript code from the rules
    const grammarJs = generate(grammarInfoObject, "grammar");
    // Pretend this is a CommonJS environment to catch exports from the grammar.
    const exports = {default :{}};
    eval(await ts.transpile(grammarJs))

    return new nearley.Parser(nearley.Grammar.fromCompiled(<CompiledRules>exports.default));
}


// describe('visual2.conf', async () => {
//     const parser = await parserForSource("src/app/services/importer/importers/brat/VisualConfGrammar.ne");
//
//     let config = fs.readFileSync(path.join(__dirname,"./visual2.conf")).toString()
//
//     parser.feed(config)
//     let result =  parser.finish();
//
//     console.log("Result", result[0])
//
// });
//
// describe('visual.conf', async () => {
//     const parser = await parserForSource("src/app/services/importer/importers/brat/VisualConfGrammar.ne");
//
//     let config = fs.readFileSync(path.join(__dirname,"./visual.conf")).toString()
//
//     parser.feed(config)
//     let result =  parser.finish();
//
//     console.log("Result", result[0])
//
// });
//
//
describe('annotation.conf', async () => {
    const parser = await parserForSource("src/app/services/importer/importers/brat/AnnotationConfGrammar.ne");

    let config = fs.readFileSync(path.join(__dirname,"./annotation.conf")).toString()

    parser.feed(config)
    let result =  parser.finish();

    console.log("Result", result[0][0])

});

describe('annotation2.conf', async () => {
    const parser = await parserForSource("src/app/services/importer/importers/brat/AnnotationConfGrammar.ne");

    let config = fs.readFileSync(path.join(__dirname,"./annotation2.conf")).toString()

    parser.feed(config)
    let result =  parser.finish();

    console.log("Result", result)

});

describe('test.ann', async () => {
    const parser = await parserForSource("src/app/services/importer/importers/brat/AnnGrammar.ne");

    let config = fs.readFileSync(path.join(__dirname,"./test.ann")).toString()

    parser.feed(config)
    let result =  parser.finish();

    console.log("Result", result)

});