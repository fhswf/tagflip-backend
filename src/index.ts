/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import * as cookieParser from "cookie-parser";
import * as cors from "cors";
import { CorsOptions } from "cors";
import * as express from "express";
import * as logger from "morgan";
import * as path from "path";
import { Server } from "typescript-rest";

import config from './app/Config'
import { AnnotationController } from "./app/controllers/AnnotationController";
import { AnnotationSetController } from "./app/controllers/AnnotationSetController";
import { AnnotationTaskController } from "./app/controllers/AnnotationTaskController";
import { AnnotationTaskDocumentController } from "./app/controllers/AnnotationTaskDocumentController";
import { CorpusController } from "./app/controllers/CorpusController";
import { DocumentController } from "./app/controllers/DocumentController";
import { TagController } from "./app/controllers/TagController";
import { TestController } from "./app/controllers/TestController";

import { StatusCodes } from "http-status-codes";
import { HttpError } from "typescript-rest/dist/server/model/errors";


// configure cors
const corsOptions: CorsOptions = {
    credentials: true,
    exposedHeaders: ['Content-Disposition'],
    origin: (origin, callback) => {
        if (!origin || config.allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true)
        } else {
            callback(new Error(`Origin ${origin} not allowed by CORS`))
        }
    },
};

const errorMiddleware = (error: HttpError, request: express.Request, response: express.Response) => {
    const message = error.message;
    const statusCode = error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
    console.error(error);
    response.status(statusCode).send(Object.assign({}, error, { message }))
}

class TagFlipServer {

    private readonly app!: express.Application;

    constructor() {
        this.app = express();
    }

    public run() {
        this.app.use(cors(corsOptions));
        this.app.use(logger('dev'));
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: false }));
        this.app.use(cookieParser());
        this.app.use(express.static(path.join(__dirname, 'public'))); // configure later with GUI...

        // Simulate delay
        if (config.delayResponse > 0) {
            this.app.use((req, res, next) => {
                setTimeout(() => next(), config.delayResponse);
            });
        }

        Server.buildServices(this.app,
            TestController, CorpusController, DocumentController,
            AnnotationSetController, AnnotationController, TagController, AnnotationTaskController, AnnotationTaskDocumentController);
        this.app.listen(config.serverPort, () => {
            console.log(`Server listening on port {config.serverPort}!`);
        });

        // error handler
        this.app.use(errorMiddleware);
    }

}

new TagFlipServer().run()
