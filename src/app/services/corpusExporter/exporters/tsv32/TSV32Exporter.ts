import {
  HttpError,
  UnprocessableEntityError,
} from "typescript-rest/dist/server/model/errors";
import AbstractExporter, { Exporter } from "../AbstractExporter";
import { Inject } from "typescript-ioc";
import { CorpusRepository } from "../../../../persistence/dao/CorpusRepository";
import { Corpus } from "../../../../persistence/model/Corpus";
import { Document } from "../../../../persistence/model/Document";
import * as _ from "lodash";
import { Tag } from "../../../../persistence/model/Tag";
import * as fs from "fs";
import * as path from "path";

class SentencePartition {
  private _partitionNumber: number;
  private _sentences: Sentence[];

  private _assignedTags: Tag[] = [];

  private _firstStartIndex: number = -1;
  private _lastEndIndex: number = -1;

  constructor(_partitionNumber: number, sentences: Sentence[]) {
    this._partitionNumber = _partitionNumber;
    this._sentences = sentences;
    let firstStartIndex = _.min(sentences.map((x) => x.firstStartIndex));
    if (firstStartIndex === undefined)
      throw new Error("could not find first index in partition");
    this._firstStartIndex = firstStartIndex;
    let lastEndIndex = _.max(sentences.map((x) => x.lastEndIndex));
    if (lastEndIndex === undefined)
      throw new Error("could not find last index in partition");
    this._lastEndIndex = lastEndIndex;
  }

  get partitionNumber(): number {
    return this._partitionNumber;
  }

  set partitionNumber(value: number) {
    this._partitionNumber = value;
  }

  get sentences(): Sentence[] {
    return this._sentences;
  }

  set sentences(value: Sentence[]) {
    this._sentences = value;
  }

  get lastEndIndex(): number {
    return this._lastEndIndex;
  }

  get firstStartIndex(): number {
    return this._firstStartIndex;
  }

  get assignedTags(): Tag[] {
    return this._assignedTags;
  }

  set assignedTags(value: Tag[]) {
    this._assignedTags = value;
  }
}

class Sentence {
  private _sentenceNumber!: number;

  private _tokens!: Token[];

  private _firstStartIndex!: number;

  private _lastEndIndex!: number;

  constructor(_sentenceNumber: number, tokens: Token[]) {
    if (tokens.length == 0) {
      throw new Error("No tokens in sentence");
    }
    this._sentenceNumber = _sentenceNumber;
    this._tokens = tokens;
    let firstStartIndex = _.min(tokens.map((x) => x.startIndex));
    if (firstStartIndex === undefined)
      throw new Error("could not find first index in sentence");
    this._firstStartIndex = firstStartIndex;
    let lastEndIndex = _.max(tokens.map((x) => x.endIndex)) || -1;
    if (lastEndIndex === undefined)
      throw new Error("could not find last index in sentence");
    this._lastEndIndex = lastEndIndex;
  }

  get sentenceNumber(): number {
    return this._sentenceNumber;
  }

  set sentenceNumber(value: number) {
    this._sentenceNumber = value;
  }

  get tokens(): Token[] {
    return this._tokens;
  }

  set tokens(value: Token[]) {
    this._tokens = value;
  }

  get firstStartIndex(): number {
    return this._firstStartIndex;
  }

  get lastEndIndex(): number {
    return this._lastEndIndex;
  }
}

class Token {
  private _startIndex!: number;
  private _endIndex!: number;
  private _string!: string;
  private _tags!: TagSeries[];

  constructor(
    startIndex: number = 0,
    theString: string = "",
    tags: TagSeries[] = []
  ) {
    this._startIndex = startIndex;
    this._string = theString;
    this._endIndex = startIndex + theString.length;
    this._tags = tags;
  }

  public hasText(): boolean {
    return this._string.length > 0;
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
    return <TagSeries[]>this._tags;
  }

  public appendTag(value: TagSeries) {
    this._tags.push(value);
  }

  public appendTags(value: TagSeries[]) {
    this._tags.push(...value);
  }
}

class TagSeries {
  private static _INDEX_COUNTER: number = 1;

  private _tag!: Tag;
  private _seriesLength!: number;
  private _disambiguationID!: number;

  private _firstTokenHasBeenWritten!: boolean;
  private _writeOrderIndex?: number;

  constructor(tag: Tag, disambiguationID: number, seriesLength: number = 0) {
    this._tag = tag;
    this._seriesLength = seriesLength;
    this._disambiguationID = disambiguationID;
    this._firstTokenHasBeenWritten = false;
    this._writeOrderIndex = undefined;
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

  get firstTokenHasBeenWritten(): boolean {
    return this._firstTokenHasBeenWritten;
  }

  set firstTokenHasBeenWritten(value: boolean) {
    this._firstTokenHasBeenWritten = value;
  }

  get writeOrderIndex(): number | undefined {
    return this._writeOrderIndex;
  }

  set writeOrderIndex(value: number | undefined) {
    this._writeOrderIndex = value;
  }

  asIOB(): string {
    if (this.firstTokenHasBeenWritten) return "I_" + this.tag.annotation.name;
    return "B_" + this.tag.annotation.name;
  }
}

enum State {
  WORD,
  SPACE,
  PUNCTATION,
}

/**
 * An Exporter for the WebAnno TSV 3.2 format. For more information see {@link https://webanno.github.io/webanno/releases/3.4.5/docs/user-guide.html#sect_webannotsv}.
 */
@Exporter("WebAnno TSV 3.2")
export class TSV32Exporter extends AbstractExporter {
  @Inject
  private corpusRepository!: CorpusRepository;

  constructor() {
    super();
  }

  protected async doExport(
    corpusId: number,
    targetFolder: string,
    iob?: boolean
  ): Promise<any> {
    let corpus: Corpus = await this.corpusRepository.read(corpusId);
    const documents: Document[] = await corpus.getDocuments({ scope: "full" });
    for (let document of documents) {
      fs.writeFileSync(
        path.join(targetFolder, document.filename + ".tsv"),
        await this.documentToTSV(document, iob || false)
      );
    }
  }

  private tokenize(text: string): Sentence[] {
    let token: Token = new Token();
    let tokens: any[] = [];
    let state: State | undefined = undefined;
    let index = 0;
    let sentences = [];
    let sentenceNumber = 0;
    for (let char of text) {
      if (/[\wäßüö\-\_\+]/.test(char)) {
        if (state !== State.WORD) {
          if (token.hasText()) {
            token.endIndex = index;
            tokens.push(token);
          }
          token = new Token(index);
        }
        token.append(char);
        state = State.WORD;
      } else if (/\s/.test(char)) {
        if (state !== State.SPACE) {
          if (token.hasText()) {
            token.endIndex = index;
            tokens.push(token);
          }
          token = new Token(index);
        }
        if (char === "\n") {
          if (tokens.length > 0) {
            sentences.push(new Sentence(sentenceNumber++, tokens));
          }
          tokens = [];
        }
        state = State.SPACE;
      } else {
        if (state !== State.PUNCTATION) {
          if (token.hasText()) {
            token.endIndex = index;
            tokens.push(token);
          }
          token = new Token(index);
        }
        token.append(char);
        state = State.PUNCTATION;
      }
      index++;
    }
    if (tokens.length > 0)
      sentences.push(new Sentence(sentenceNumber++, tokens));
    return sentences;
  }

  private tokenToTSV(
    sentenceNumber: number,
    tokenNumber: number,
    token: Token,
    iob: boolean,
    subtokenNumber?: number
  ): string {
    let line = [];
    if (!subtokenNumber) line.push(sentenceNumber + "-" + tokenNumber);
    else line.push(sentenceNumber + "-" + tokenNumber + "." + subtokenNumber);
    line.push(token.startIndex + "-" + token.endIndex);
    line.push(token.string);

    let coveringTags = [];
    let subTokenTags = [];
    // determine whether tags apply to the whole token (coveringTags) or to a substring of the token (subTokenTags)
    for (let tagSeries of token.tags) {
      if (
        tagSeries.tag.startIndex > token.startIndex ||
        tagSeries.tag.endIndex < token.endIndex
      ) {
        subTokenTags.push(tagSeries);
      } else {
        coveringTags.push(tagSeries);
      }
    }

    // coveringTags can be handled immediately ...
    // let asteriskLine = []
    let tagLine = [];

    if (coveringTags.length === 0) {
      // asteriskLine.push("_")
      if (iob) {
        tagLine.push("O");
      } else {
        tagLine.push("_");
      }
    } else {
      if (iob) {
        // if (coveringTags.length > 2) {
        //   throw new UnprocessableEntityError(
        //     "Currently only two nested tags are allowed. Found: " +
        //       coveringTags.length +
        //       " at sentence: " +
        //       sentenceNumber +
        //       ", token: " +
        //       tokenNumber
        //   );
        // }
        let tagLineMap = coveringTags.map((_) => "O");
        for (let tag of coveringTags.sort((x) => -x.seriesLength)) {
          if (tag.firstTokenHasBeenWritten) {
            tagLineMap[tag.writeOrderIndex || 0] = tag.asIOB();
          } else {
            // find minimum free index
            let minIndex = _.min(
              coveringTags
                .filter(
                  (x) =>
                    x.writeOrderIndex != undefined && x.writeOrderIndex >= 0
                )
                .map((x) => x.writeOrderIndex)
            );
            let maxIndex = _.max(
              coveringTags
                .filter(
                  (x) =>
                    x.writeOrderIndex != undefined && x.writeOrderIndex >= 0
                )
                .map((x) => x.writeOrderIndex)
            );
            if (minIndex == undefined) minIndex = 0;
            // @ts-ignore
            else if (minIndex <= 0) {
              // @ts-ignore
              minIndex = maxIndex + 1;
            } else {
              minIndex -= 1;
            }
            tag.writeOrderIndex = minIndex;
            tagLineMap[tag.writeOrderIndex || 0] = tag.asIOB();
            tag.firstTokenHasBeenWritten = true;
          }
        }
        for (const tag of tagLineMap) {
          // @ts-ignore
          tagLine.push(tag);
        }
      } else {
        for (let tag of coveringTags) {
          if (tag.seriesLength === 1) {
            // asteriskLine.push("*")
            tagLine.push(tag.tag.annotation.name);
          } else {
            // asteriskLine.push("*"+"["+ tag.disambiguationID + "]")
            tagLine.push(
              tag.tag.annotation.name + "[" + tag.disambiguationID + "]"
            );
          }
        }
      }
    }

    // line.push(asteriskLine.join("|"))
    line.push(tagLine.join("|"));
    let lines = [line.join("\t")];

    // subtokenTags must be handled separately. This can be done recursively once tags are mapped to subtokens properly
    if (!subtokenNumber) {
      //apply tags to corresponding subTokens
      const subtokens = new Map<string, Token>();
      for (let subTokenTag of subTokenTags) {
        if (
          !subtokens.has(
            subTokenTag.tag.startIndex + ":" + subTokenTag.tag.endIndex
          )
        ) {
          // subtoken is unknown... make it known since one subtoken can have multiple tags
          let startIndex =
            subTokenTag.tag.startIndex <= token.startIndex
              ? token.startIndex
              : subTokenTag.tag.startIndex; // startIndex in prev token or here?
          let subToken = new Token(
            startIndex,
            token.string.substr(
              startIndex - token.startIndex,
              subTokenTag.tag.endIndex - startIndex
            )
          ); // slice substring
          subtokens.set(
            subTokenTag.tag.startIndex + ":" + subTokenTag.tag.endIndex,
            subToken
          );
        }
        // here we can be sure, that subtoken for subTokenTag.tag.startIndex+":"+subTokenTag.tag.endIndex exists
        // @ts-ignore
        subtokens
          .get(subTokenTag.tag.startIndex + ":" + subTokenTag.tag.endIndex)
          .appendTag(subTokenTag); // apply current tag to subtoken
      }
      // handle subtokens as they were regular tokens by recursively calling the method again
      let subtokenNumber = 1;
      for (let subtoken of _.sortBy([...subtokens.values()], ["startIndex"])) {
        lines.push(
          this.tokenToTSV(
            sentenceNumber,
            tokenNumber,
            subtoken,
            iob,
            subtokenNumber++
          )
        );
      }
    }

    return lines.join("\n");
  }

  private tokensToSentenceString(tokens: Token[]): string {
    let line = ["#Text="];
    if (tokens.length === 0) return line.join("");

    let index = tokens[0].startIndex;
    for (let token of tokens) {
      while (index < token.startIndex) {
        line.push(" ");
        index++;
      }
      line.push(token.string);
      index = token.endIndex;
    }

    return line.join("");
  }

  private sentencesToTSV(sentences: Sentence[], iob: boolean): string {
    let lines = [];
    lines.push("#FORMAT=WebAnno TSV 3.2");
    lines.push("#T_SP=webanno.custom.TagFlip|value");
    lines.push("");
    lines.push("");

    let sentenceNumber = 1;
    for (let sentence of sentences) {
      if (sentence.tokens.length > 0) {
        let tokenNumber = 1;
        lines.push(this.tokensToSentenceString(sentence.tokens));
        for (let token of sentence.tokens) {
          lines.push(
            this.tokenToTSV(sentenceNumber, tokenNumber++, token, iob)
          );
        }
        lines.push("");
        sentenceNumber++;
      }
    }

    return lines.join("\n");
  }

  private async documentToTSV(
    document: Document,
    iob: boolean
  ): Promise<string> {
    let text = document.content || "";
    let tags = _.sortBy(
      await document.getTags({ include: ["annotation"] }),
      (t) => t.startIndex
    );

    text = text.replace(/\r\n/g, "\n"); // Windows... any other solution?

    const disambiguationIds: number[] = [];
    let disambiguationId = 1;
    tags.forEach((t) => disambiguationIds.push(disambiguationId++));

    // let time = new Date().getTime();
    let sentences = this.tokenize(text);
    let partitions: SentencePartition[] = await this.generateSentenceSplits(
      tags,
      sentences
    );

    let totalSentencePromises: Promise<Sentence[]>[] = [];
    for (let partition of partitions) {
      let partitionDisambiguationIds: number[] = [];
      for (let i = 0; i < partition.assignedTags.length; i++) {
        partitionDisambiguationIds.push(
          disambiguationIds.pop() ||
            (() => {
              throw new Error("No disambiguation Ids left");
            })()
        );
      }
      // totalSentences.push(... await this.assignTagsToTokens(partition.assignedTags, partition.sentences, partitionDisambiguationIds))
      totalSentencePromises.push(
        assignTagsToTokens(
          partition.assignedTags,
          partition.sentences,
          partitionDisambiguationIds
        )
      );
    }
    let totalSentences: Sentence[] = [];
    await Promise.all(totalSentencePromises).then((result: Sentence[][]) => {
      for (let sentences of result) {
        totalSentences.push(...sentences);
      }
    });
    // console.log(
    //   "Processing",
    //   sentences.length,
    //   "sentences took",
    //   new Date().getTime() - time,
    //   "ms"
    // );

    return this.sentencesToTSV(totalSentences, iob);
  }

  private async generateSentenceSplits(
    tags: Tag[],
    sentences: Sentence[]
  ): Promise<SentencePartition[]> {
    let partitionNumber = 0;
    tags = _.sortBy(tags, (t) => t.startIndex);

    const tmpSentencePartitions: SentencePartition[] = _.chunk(
      sentences,
      Math.ceil(100)
    ).map((x) => new SentencePartition(partitionNumber++, x));
    const sentencePartitions: Map<number, SentencePartition> = new Map();
    for (const tmpSentencePartition of tmpSentencePartitions) {
      sentencePartitions.set(
        tmpSentencePartition.partitionNumber,
        tmpSentencePartition
      );
    }

    const globalAssignedTags = new Set();
    for (let partition of sentencePartitions.values()) {
      for (let tag of tags) {
        if (
          tag.startIndex >= partition.firstStartIndex &&
          tag.endIndex <= partition.lastEndIndex
        ) {
          partition.assignedTags.push(tag);
          globalAssignedTags.add(tag);
        }
      }
    }
    const overlappingTags = new Set(
      [...tags].filter((x) => !globalAssignedTags.has(x))
    );
    const unionInstructions: number[][] = [];

    const tmpSentencePartitions2 = [...sentencePartitions.values()];
    for (let tag of overlappingTags) {
      let relevantPartitions: SentencePartition[] = tmpSentencePartitions2.filter(
        (x) =>
          (tag.startIndex >= x.firstStartIndex &&
            tag.startIndex < x.lastEndIndex &&
            tag.endIndex > x.lastEndIndex) ||
          (tag.startIndex < x.firstStartIndex &&
            tag.endIndex >= x.firstStartIndex &&
            tag.endIndex <= x.lastEndIndex)
      ); // end partition
      relevantPartitions.forEach((x) => x.assignedTags.push(tag));
      unionInstructions.push(
        _.sortBy(relevantPartitions.map((x) => x.partitionNumber))
      );
    }
    for (const partitionIds of unionInstructions) {
      let lowestId = partitionIds[0];
      let newSentences = [];
      let newTags = [];
      let expectedNextId = lowestId;
      for (const partitionId of partitionIds) {
        if (expectedNextId != partitionId)
          throw new Error("Unexpected gap between sentence partitions");
        let part = sentencePartitions.get(partitionId);
        // @ts-ignore
        newSentences.push(...part.sentences);
        // @ts-ignore
        newTags.push(...part.assignedTags);
        expectedNextId = partitionId + 1;
        sentencePartitions.delete(partitionId);
      }
      let newPartition = new SentencePartition(lowestId, newSentences);
      newPartition.assignedTags = _.uniqBy(newTags, (x) => x.tagId);
      sentencePartitions.set(lowestId, newPartition);
    }
    let idx = 0;
    let sortedPartitions: SentencePartition[] = _.sortBy(
      [...sentencePartitions.values()],
      (x) => x.firstStartIndex
    );
    sortedPartitions.forEach((x) => (x.partitionNumber = idx));

    return sortedPartitions;
  }

  supportsIOB(): boolean {
    return true;
  }
}

async function assignTagsToTokens(
  relevantTags: Tag[],
  sentences: Sentence[],
  disambiguationIds: number[]
): Promise<Sentence[]> {
  // let index = 0;
  // let deltas = [0, 0, 0, 0, 0, 0, 0, 0, 0]
  let tags = relevantTags;
  let activeTags: TagSeries[] = [];
  for (let sentence of sentences) {
    let startTime = new Date().getTime();
    // find out which tags are relevant to current token (or at least relevant to substring of the token)
    for (let token of sentence.tokens) {
      // remove old... Note: tag/token.endIndex is exclusive
      activeTags = _.filter(
        activeTags,
        (t) =>
          t.tag.endIndex >= token.endIndex ||
          (t.tag.endIndex > token.startIndex &&
            t.tag.endIndex <= token.endIndex)
      );

      // accept new tags
      activeTags.push(
        ..._.filter(
          tags,
          (t) =>
            t.startIndex >= token.startIndex && t.startIndex < token.endIndex
        ).map((t) => new TagSeries(t, disambiguationIds.pop() || -100))
      ); // Note: binary search might not be useful here since ordering is either done via startIndex xor via endIndex -> therefore only filter.
      // apply tags current to token
      activeTags.forEach((t) => t.seriesLength++); // update "length" of tags with respect to tokens - Note: this gives the information about tags which span across more than one token.
      token.appendTags(activeTags);
    }
    // reduce tags to future relevant
    tags = _.filter(tags, (t) => t.startIndex >= sentence.firstStartIndex); // TODO: performance could be improved using binary search via startIndex.. lodash does not provide a function for that -> filter for now. write custom binary search
  }

  return sentences;
}
