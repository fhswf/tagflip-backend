import * as fs from 'fs';
import * as path from "path";

const normalizedPath = path.join(path.resolve(__dirname));

fs.readdirSync(normalizedPath).forEach(function (file) {
    require(path.join(normalizedPath, file));
});

import { CorpusImportService } from "./CorpusImportService";

export default CorpusImportService