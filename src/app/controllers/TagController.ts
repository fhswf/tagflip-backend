import {
    DELETE,
    Errors,
    GET,
    Path,
    PathParam,
    POST,
    PUT,
    QueryParam,
} from "typescript-rest";

import { CorpusRepository } from "../persistence/dao/CorpusRepository";
import { DocumentRepository } from "../persistence/dao/DocumentRepository";
import { TagRepository } from "../persistence/dao/TagRepository";
import { Document } from "../persistence/model/Document";
import { Tag } from "../persistence/model/Tag";

import { Inject } from "typescript-ioc";

@Path("document/:documentId/tag")
export class TagController {


    @Inject
    private documentRepository!: DocumentRepository;

    @Inject
    private tagRepository!: TagRepository;

    @GET
    public async list(@PathParam("documentId") documentId: number, @QueryParam("annotationTaskId") annotationTaskId: number): Promise<Tag[]> {
        const document: Document = await this.documentRepository.read(documentId);
        if (annotationTaskId) {
            return document.getTags({ where: { annotationTaskId } });
        }
        return document.getTags();
    }

    @Path(":id")
    @GET
    public async read(@PathParam("documentId") documentId: number, @PathParam("id") tagId: number): Promise<Tag> {
        const tag = await this.tagRepository.read(tagId);
        if (tag.documentId !== documentId) {
            throw new Errors.NotFoundError("Given document with ID " + documentId + " does not contain tag");
        }
        return tag
    }

    @POST
    public async create(@PathParam("documentId") documentId: number, tag: Tag): Promise<Tag> {
        tag.documentId = documentId;
        tag = await this.tagRepository.save(tag)

        return tag
    }

    @PUT
    public async update(@PathParam("documentId") documentId: number, tag: Tag): Promise<Tag | null> {
        tag.documentId = documentId;
        tag = await this.tagRepository.save(tag)

        return tag;
    }

    @Path(":id")
    @DELETE
    public async delete(@PathParam("documentId") documentId: number, @PathParam("id") tagId: number): Promise<void> {
        const tag = await this.tagRepository.read(tagId);
        if (tag.documentId !== documentId) {
            throw new Errors.NotFoundError("Given document with ID " + documentId + " does not contain tag");
        }
        await this.tagRepository.delete(tag.tagId);
    }
}
