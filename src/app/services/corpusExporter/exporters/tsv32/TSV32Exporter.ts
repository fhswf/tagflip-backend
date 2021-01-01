/* eslint-disable id-blacklist */
/* eslint-disable no-underscore-dangle */
/* eslint-disable max-classes-per-file */
import * as fs from "fs";
import * as path from "path";
import { Inject } from "typescript-ioc";
import * as _ from "lodash"
import AbstractExporter, { Exporter } from "../AbstractExporter";
import { CorpusRepository } from "../../../../persistence/dao/CorpusRepository";
import { Corpus } from "../../../../persistence/model/Corpus";
import { Document } from "../../../../persistence/model/Document";
import { Tag } from "../../../../persistence/model/Tag";


class Sentence {
    private _tokens!: Token[]

    constructor(tokens: Token[]) {
        this._tokens = tokens
    }

    get tokens(): Token[] {
        return this._tokens;
    }

    set tokens(value: Token[]) {
        this._tokens = value;
    }
}

class Token {
    private _startIndex!: number;
    private _endIndex!: number;
    private _string!: string
    private _tags!: TagSeries[];

    constructor(startIndex = 0, theString = "", tags: TagSeries[] = []) {
        this._startIndex = startIndex;
        this._string = theString
        this._endIndex = startIndex + theString.length;
        this._tags = tags
    }

    public hasText(): boolean {
        return this._string.length > 0
    }

    public append(char: string): Token {
        this._string += char;
        return this;
    }

    get startIndex(): number {
        return this._startIndex;
    }

    set startIndex(value: number) {
        this._startIndex = value;
    }

    get endIndex(): number {
        return this._endIndex;
    }

    set endIndex(value: number) {
        this._endIndex = value;
    }

    get string(): string {
        return this._string;
    }

    set string(value: string) {
        this._string = value;
    }

    get tags(): TagSeries[] {
        return this._tags;
    }

    public appendTag(value: TagSeries) {
        this._tags.push(value);
    }

    public appendTags(value: TagSeries[]) {
        this._tags.push(...value);
    }

}

class TagSeries {

    static INDEX_COUNTER = 1

    private _tag!: Tag
    private _seriesLength!: number
    private _disambiguationID!: number

    constructor(tag: Tag, disambiguationID: number, seriesLength = 0) {
        this._tag = tag;
        this._seriesLength = seriesLength;
        this._disambiguationID = disambiguationID;
    }

    get disambiguationID(): number {
        return this._disambiguationID;
    }

    set disambiguationID(value: number) {
        this._disambiguationID = value;
    }

    get seriesLength(): number {
        return this._seriesLength;
    }

    set seriesLength(value: number) {
        this._seriesLength = value;
    }

    get tag(): Tag {
        return this._tag;
    }

    set tag(value: Tag) {
        this._tag = value;
    }
}

enum State {
    WORD, SPACE, PUNCTATION
}

/**
 * An Exporter for the WebAnno TSV 3.2 format. For more information see {@link https://webanno.github.io/webanno/releases/3.4.5/docs/user-guide.html#sect_webannotsv}.
 */
@Exporter("WebAnno TSV 3.2")
export class TSV32Exporter extends AbstractExporter {

    @Inject
    private corpusRepository!: CorpusRepository

    constructor() {
        super();
    }

    protected async doExport(corpusId: number, targetFolder: string): Promise<any> {
        const corpus: Corpus = await this.corpusRepository.read(corpusId);
        const documents: Document[] = await corpus.getDocuments({ scope: 'full' });
        for (const document of documents) {
            fs.writeFileSync(path.join(targetFolder, document.filename + ".tsv"), await this.documentToTSV(document))
        }
    }

    private tokenize(text: string): Sentence[] {
        let token: Token = new Token();
        let tokens: any[] = []
        let state: State | undefined
        let index = 0;
        const sentences = []
        for (const char of text) {
            if (/\w/.test(char)) {
                if (state !== State.WORD) {
                    if (token.hasText()) {
                        token.endIndex = index;
                        tokens.push(token)
                    }
                    token = new Token(index)
                }
                token.append(char);
                state = State.WORD
            } else if (/\s/.test(char)) {
                if (state !== State.SPACE) {
                    if (token.hasText()) {
                        token.endIndex = index;
                        tokens.push(token)
                    }
                    token = new Token(index)
                }
                if (char === "\n") {
                    sentences.push(new Sentence(tokens))
                    tokens = []
                }
                state = State.SPACE
            } else {
                if (state !== State.PUNCTATION) {
                    if (token.hasText()) {
                        token.endIndex = index;
                        tokens.push(token)
                    }
                    token = new Token(index)
                }
                token.append(char);
                state = State.PUNCTATION
            }
            index++;
        }
        sentences.push(new Sentence(tokens))
        return sentences;
    }

    private tokenToTSV(sentenceNumber: number, tokenNumber: number, token: Token, subtokenNumber?: number): string {
        const line = []
        if (!subtokenNumber)
            line.push(`{sentenceNumber}-{tokenNumber}`)
        else
            line.push(`{sentenceNumber}-{tokenNumber}.{subtokenNumber}`)
        line.push(`{token.startIndex}-{token.endIndex}`)
        line.push(token.string)

        const coveringTags = []
        const subTokenTags = []
        // determine whether tags apply to the whole token (coveringTags) or to a substring of the token (subTokenTags)
        for (const tagSeries of token.tags) {
            if (tagSeries.tag.startIndex > token.startIndex || tagSeries.tag.endIndex < token.endIndex) {
                subTokenTags.push(tagSeries)
            } else {
                coveringTags.push(tagSeries);
            }
        }

        // coveringTags can be handled immediately ...
        // let asteriskLine = []
        const tagLine = []
        if (coveringTags.length === 0) {
            // asteriskLine.push("_")
            tagLine.push("_")
        } else {
            for (const tag of coveringTags) {
                if (tag.seriesLength === 1) {
                    // asteriskLine.push("*")
                    tagLine.push(tag.tag.annotation.name)
                } else {
                    // asteriskLine.push("*"+"["+ tag.disambiguationID + "]")
                    tagLine.push(tag.tag.annotation.name + "[" + tag.disambiguationID + "]")
                }
            }
        }


        // line.push(asteriskLine.join("|"))
        line.push(tagLine.join("|"))
        const lines = [line.join("\t")]

        // subtokenTags must be handled separately. This can be done recursively once tags are mapped to subtokens properly
        if (!subtokenNumber) {
            // apply tags to corresponding subTokens
            const subtokens = new Map<string, Token>();
            for (const subTokenTag of subTokenTags) {
                if (!subtokens.has(subTokenTag.tag.startIndex + ":" + subTokenTag.tag.endIndex)) {
                    // subtoken is unknown... make it known since one subtoken can have multiple tags
                    const startIndex = subTokenTag.tag.startIndex <= token.startIndex ? token.startIndex : subTokenTag.tag.startIndex // startIndex in prev token or here?
                    const subToken = new Token(startIndex, token.string.substr(startIndex - token.startIndex, subTokenTag.tag.endIndex - startIndex)) // slice substring
                    subtokens.set(subTokenTag.tag.startIndex + ":" + subTokenTag.tag.endIndex, subToken);
                }
                // here we can be sure, that subtoken for subTokenTag.tag.startIndex+":"+subTokenTag.tag.endIndex exists
                // @ts-ignore
                subtokens.get(subTokenTag.tag.startIndex + ":" + subTokenTag.tag.endIndex).appendTag(subTokenTag); // apply current tag to subtoken
            }
            // handle subtokens as they were regular tokens by recursively calling the method again
            let subtokenNumber = 1;
            for (const subtoken of _.sortBy([...subtokens.values()], ["startIndex"])) {
                lines.push(this.tokenToTSV(sentenceNumber, tokenNumber, subtoken, subtokenNumber++));
            }
        }

        return lines.join("\n")
    }

    private tokensToSentenceString(tokens: Token[]): string {
        const line = ["#Text="]
        if (tokens.length === 0)
            return line.join("");

        let index = tokens[0].startIndex;
        for (const token of tokens) {
            while (index < token.startIndex) {
                line.push(" ");
                index++;
            }
            line.push(token.string)
            index = token.endIndex;
        }


        return line.join("");
    }

    private sentencesToTSV(sentences: Sentence[]): string {
        const lines = [];
        lines.push("#FORMAT=WebAnno TSV 3.2")
        lines.push("#T_SP=webanno.custom.TagFlip|value")
        lines.push("")
        lines.push("")

        let sentenceNumber = 1;
        for (const sentence of sentences) {
            if (sentence.tokens.length > 0) {
                let tokenNumber = 1
                lines.push(this.tokensToSentenceString(sentence.tokens))
                for (const token of sentence.tokens) {
                    lines.push(this.tokenToTSV(sentenceNumber, tokenNumber++, token))
                }
                lines.push("")
                sentenceNumber++;
            }
        }

        return lines.join("\n");
    }

    private async documentToTSV(document: Document): Promise<string> {
        let text = document.content || "";
        let tags = _.sortBy(await document.getTags({ include: ['annotation'] }), (t) => t.startIndex);

        text = text.replace(/\r\n/g, "\n") // Windows... any other solution?

        const sentences = this.tokenize(text);

        // map tags to tokens and determine length of tag - chains
        let activeTags: TagSeries[] = []
        let disambiguationId = 1;
        for (const sentence of sentences) {
            // find out which tags are relevant to current token (or at least relevant to substring of the token)
            for (const token of sentence.tokens) {
                // remove old... Note: tag/token.endIndex is exclusive
                activeTags = _.filter(activeTags, (t) => t.tag.endIndex >= token.endIndex || (t.tag.endIndex > token.startIndex && t.tag.endIndex <= token.endIndex));

                // reduce tags to future relevant
                tags = _.filter(tags, (t) => t.startIndex >= token.startIndex) // TODO: performance could be improved using binary search via startIndex.. lodash does not provide a function for that -> filter for now. write custom binary search
                // accept new tags
                activeTags.push(..._.filter(tags, (t) => t.startIndex >= token.startIndex && t.startIndex < token.endIndex).map((t) => new TagSeries(t, disambiguationId++))); // Note: binary search might not be useful here since ordering is either done via startIndex xor via endIndex -> therefore only filter.
                // apply tags current to token
                activeTags.forEach((t) => t.seriesLength++) // update "length" of tags with respect to tokens - Note: this gives the information about tags which span across more than one token.
                token.appendTags(activeTags);
            }
        }
        return this.sentencesToTSV(sentences);
    }

}
