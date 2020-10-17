import * as fs from 'fs';
import * as path from "path";
import AbstractExporter from "./AbstractExporter";
import * as recursive from "recursive-readdir";

const normalizedPath = path.join(path.resolve(__dirname));

recursive(normalizedPath, ["!*.+(ts|js)"], (err, files) => {
    for (const file of files) {
        if (fs.statSync(file).isFile())
            require(file);
    }
})


export default AbstractExporter
