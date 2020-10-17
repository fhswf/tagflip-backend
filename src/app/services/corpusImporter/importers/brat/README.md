#Importering BRAT Standoff Format
BRAT Rapid Annotation Tool offers a quite complex file format for 
their Annotation configuration and their Annotation data. Parsing this format
"by hand" would be sort of ugly text surgery which has been prevented in this place.

Instead, a JavaScript based Parser-Framework called `nearley` has been used to partially
define the BRAT Standoff File Format as Type-3-Grammars in 
nearley's notation and to auto-generate Parsers out of them. 

Looking through this directory you will find `.ne`-files. These files contain the grammar 
definitions. A grammar can be translated into a Parser using the CLI by typing in: 
```
    nearleyc XY.ne -o XY.ts
```
where the first argument is the grammar-file and the second parameter `-o` defines the output-file.
Usually nearley generates JavaScript. By declaring `@preprocessor typescript` at the header section top of a grammar file, 
TypeScript can be produced.


