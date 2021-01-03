import { Document } from "../../../persistence/model/Document";
import DocumentPersistor, { mimetypes } from "./DocumentPersistor";
import * as streamBuffers from 'stream-buffers';
import * as fs from 'fs';
import * as unzipper from 'unzipper';
import * as tmp from "tmp"
import * as recursive from "recursive-readdir"
import * as mime from "mime-types"
import * as path from "path";
import * as chardet from "chardet"
import * as rimraf from "rimraf"

@mimetypes(["application/zip", "application/x-zip-compressed", "multipart/x-zip"])
export default class ZipPersistor extends DocumentPersistor {

    async persist(corpusId: number, file: Express.Multer.File): Promise<Document[]> {
        const readableBuffer = new streamBuffers.ReadableStreamBuffer();
        readableBuffer.put(file.buffer)
        readableBuffer.stop();

        const tmpZip = tmp.dirSync()
        console.log('Creating temporary directory: ', tmpZip.name);

        await readableBuffer.pipe(unzipper.Extract({ path: tmpZip.name })).promise();
        const documents: Document[] = []

        const files = await new Promise<string[]>((resolve, reject) => {
            recursive(tmpZip.name, [], (err, files) => {
                if (err) {
                    reject(err)
                }
                else {
                    resolve(files)
                }
            })
        })

        const errors = []
        for (const file of files) {
            const buffer = fs.readFileSync(file)
            let mimetype = mime.lookup(file)
            if (!mimetype) {
                mimetype = "text/plain"
            }
            const encoding = chardet.detect(buffer)
            const multerFile = {
                originalname: path.basename(file),
                encoding: encoding,
                mimetype: mimetype,
                filename: path.basename(file),
                path: file,
                buffer: buffer,
            } as Express.Multer.File

            const persistor = DocumentPersistor.forType(mimetype);
            try {
                const newDocs = await persistor.persist(corpusId, multerFile);
                documents.push(...newDocs)
            } catch (err) {
                rimraf.sync(path.join(tmpZip.name, "/*"))
                tmpZip.removeCallback()
                console.log("Deleted temporary directory:", tmpZip.name)

                errors.push(err) // TODO: DO STH WITH ERRORS
                throw err;
            }
            finally {
                // do nothing
            }
        }
        rimraf.sync(path.join(tmpZip.name, "/*"))
        tmpZip.removeCallback()
        console.log("Deleted temporary directory:", tmpZip.name)

        return documents;
    }
}

