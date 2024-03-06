import {ClientSession, Document,} from "mongodb";
import {MongoInstance} from "./MongoInstance";
import {MongoCollection} from "./MongoCollection";
import {EmbeddingProvider} from "@/backend/embeddings/EmbeddingsProvider";

/** Vector Database type implementation of a MongoDB Collection */
export class MongoVectorCollection<A> extends MongoCollection<A> {

    embeddingProvider: EmbeddingProvider

    constructor(
        collectionName: string,
        instance: MongoInstance,
        embeddingProvider: EmbeddingProvider,
        public vectorIndexName: string,
        public vectorIndexField: string,
        public makeVectorContent: (a: A) => string
    ) {
        super(collectionName, instance)
        this.embeddingProvider = embeddingProvider

        // We need to override the defaultRetrieveProjection in order to exclude the Vector field
        //todo fix
        // let hideVectorField = {}
        // hideVectorField['abstract_embedding'] = 0
        // this.defaultRetrieveProjection = {...this.defaultRetrieveProjection, vectorIndexField: 0}
        this.defaultRetrieveProjection = {...this.defaultRetrieveProjection, 'abstract_embedding': 0}
    }

    async insertAndEmbed(document: A, additionalContext?: string, session?: ClientSession): Promise<A> {
        const documentWithEmbedding = await this.addEmbedding(document, additionalContext)
        this.log.debug("Created embedding, inserting to DB")
        return this.insert(documentWithEmbedding)
    }

    async insertAndEmbedMany(documents: A[], additionalContext?: string,  session?: ClientSession): Promise<A[]> {
        const addEmbeddingFutures: Promise<A>[] = documents.map((document) => this.addEmbedding(document, additionalContext))
        this.log.debug("Created embeddings, inserting to DB")
        const documentsWithEmbeddings: A[] = await Promise.all(addEmbeddingFutures)
        return this.insertMany(documentsWithEmbeddings)
    }

    private async addEmbedding(document: A, additionalContext?: string): Promise<A> {
        const embeddingContent = this.makeVectorContent(document)
        const embeddingContentWithContext = embeddingContent + ` ${additionalContext ?? ""}`
        const newDocument = document
        // @ts-ignore
        newDocument[this.vectorIndexField] = await this.embeddingProvider.createEmbedding(embeddingContentWithContext)
        return newDocument
    }

    //todo add filters for stage in $vectorSearch
    async createStringBasedAggregationStage(searchValue: string, scopeId: string, numCandidates: number = 10, limit: number = 10): Promise<Document[]> {
        const queryVector = await this.embeddingProvider.createEmbedding(searchValue)
        return [{
            '$vectorSearch': {
                'index': this.vectorIndexName,
                'path': this.vectorIndexField,
                'queryVector': queryVector,
                'numCandidates': numCandidates,
                'limit': limit,
                // "filter": {
                //     "scopeId": scopeId
                // },
            }
        }, {
            '$project': {
                '_id': 0,
                [this.vectorIndexField]: 0,
                // vectorIndexField: 0, //todo
                'score': {'$meta': 'vectorSearchScore'}
            }
        }] as Document[]
    }

    async semanticVectorSearch(value: string, scopeId: string): Promise<A[]> {
        const aggregation = await this.createStringBasedAggregationStage(value, scopeId)
        console.log(`aggregation: ${JSON.stringify(aggregation)}`)

        return this.aggregate(aggregation)
    }

}