import {
    ClientSession,
    Collection,
    Filter,
    FindOptions,
    OptionalId, OptionalUnlessRequiredId,
    Document,
    UpdateFilter,
    UpdateOptions,
} from "mongodb";
import {MongoInstance} from "./MongoInstance";
import logger from 'pino'


export class MongoCollection<A> {

    collectionName: string
    instance: MongoInstance
    protected log = logger()

    defaultRetrieveProjection = {_id: 0} as Document

    constructor(collectionName: string, instance: MongoInstance) {
        this.collectionName = collectionName
        this.instance = instance
    }

    // @ts-ignore
    async collection(): Promise<Collection<A>> {
        const resources = await this.instance.getDatabaseResources()
        return resources
        // @ts-ignore
            .collection<A>(this.collectionName)
    }

    async insert(document: A, session?: ClientSession): Promise<A> {
        const collection = await this.collection()
        const insertDoc = document as OptionalUnlessRequiredId<A>
        return await collection
            .insertOne(insertDoc, {session})
            .then((_) => Promise.resolve(document))
            .catch((err) => {
                this.log.error("Error on DB insert: " + err)
                return Promise.reject("Unable to insert document")
            })
    }

    async insertMany(documents: A[], session?: ClientSession): Promise<A[]> {
        const collection = await this.collection()
        const insertDocuments = documents as OptionalUnlessRequiredId<A>[]
        return await collection
            .insertMany(insertDocuments)
            .then((_) => Promise.resolve(documents))
            .catch((err) => {
                this.log.error("Error on DB insert: " + err)
                return Promise.reject("Unable to insert documents")
            })
    }

    // async getByIdOpt(id: string, options?: FindOptions<A>): Promise<Result<Option<A>>> {
    //     const collection = await this.collection()
    //     const query = { id: id } as Filter<A>;
    //     const resultArray = await collection.find(query, options).toArray()
    //     if(resultArray.length > 1) {
    //         console.log(`ERR: multiple results returned for getById with id ${id} in collection ${collection.collectionName}`)
    //         return ResultCO.leftResult("Multiple results returned")
    //     } else if (resultArray.length == 0) {
    //         return ResultCO.rightResult(optionFactory.empty())
    //     } else if (resultArray.length == 1) {
    //         const result = resultArray[0]
    //         return ResultCO.rightResult(optionFactory.apply(result))
    //     } else {
    //         console.log(`ERR: no match found in getById with id ${id} in collection ${collection.collectionName}`)
    //         return ResultCO.leftResult("Unknown error in getById")
    //     }
    // }

    // async getById(id: string): Promise<Result<A>> {
    //     const result = await this.getByIdOpt(id)

    //     if(ResultCO.isLeft(result)) {
    //         const left = ResultCO.getLeft(result)
    //         return ResultCO.leftResult(left)
    //     }
    //     const optA = ResultCO.getRight(result)
    //     if(optA.isEmpty()) {
    //         return ResultCO.leftResult<A>("Multiple results returned")
    //     } else {
    //         return ResultCO.rightResult<A>(optA.value)
    //     }
    // }

    //todo centralize all insertOnes accross codebase
    // async insert(doc: A, session?: ClientSession): Promise<Result<boolean>> {
    //     const collection = await this.collection()
    //     const insertDoc = doc as OptionalId<A>
    //     const result = await collection
    //         .insertOne(doc, {session})
    //
    //     return false
    //
    // }

    // async findMany(query: Filter<A>): Promise<A[]> {
    //     const collection = await this.collectionDTO()
    //     const projection = { _id: 0 } as Projection<B>
    //     return collection
    //         .find(query, {projection: projection})
    //         .toArray()
    //         .then((results) => ResultCO.rightResult(results))
    //         .catch((err) => ResultCO.leftResult(err))
    // }

    // async findOne(query: Filter<A>): Promise<A | null> {
    //     const collection = await this.collection()
    //     return await collection.findOne(query, {projection: this.defaultRetrieveProjection})
    //         .then((withId) => withId as A)
    // }
    //
    // async getOne(query: Filter<A>): Promise<A> {
    //     return this.findOne(query)
    //         .then((resultOption) => {
    //             if (resultOption === null) {
    //                 return Promise.reject("No document found")
    //             } else {
    //                 return Promise.resolve(resultOption)
    //             }
    //         })
    // }

    // async count(query: Filter<B>): Promise<Result<number>> {
    //     const collection = await this.collectionDTO()
    //     return await collection
    //         .count(query)
    //         .then((v) => ResultCO.rightResult(v))
    //         .catch((error) => {
    //             logError(error, "count")
    //             return ResultCO.leftResult(error)
    //         })
    // }


    // async updateOne(filter: Filter<A>, update: UpdateFilter<A>, session?: ClientSession, options?: UpdateOptions): Promise<Result<null>> {
    //     const collection    = await this.collection()
    //     const matchedCount   = await collection
    //         .updateOne(filter, update, {session, ...options} as UpdateOptions)
    //         .then((value) => value.matchedCount)
    //         .catch((err) => logError(err, "updateOne"))
    //     if(matchedCount == 1) {
    //         return right<string, null>(null)
    //     } else {
    //         session && await session.abortTransaction()
    //         logError(`Update's matchedCount not equal to 1, instead equal to ${matchedCount}`, "updateOne")
    //         return left<string, null>("Internal error during update")
    //     }
    // }

    // /**
    //  * Updates one, but does not fail if 0 documents were updaed
    //  * */
    // async updateOneOptionally(filter: Filter<A>, update: UpdateFilter<A>, session?: ClientSession, options?: UpdateOptions): Promise<Result<null>> {
    //     const collection    = await this.collection()
    //     const matchedCount   = await collection
    //         .updateOne(filter, update, {session, ...options} as UpdateOptions)
    //         .then((value) => value.matchedCount)
    //         .catch((err) => logError(err, "updateOne"))
    //     if(matchedCount <= 1) {
    //         return right<string, null>(null)
    //     } else {
    //         session && await session.abortTransaction()
    //         logError(`Update's matchedCount not equal to 1, instead equal to ${matchedCount}`, "updateOne")
    //         return left<string, null>("Internal error during update")
    //     }
    // }

    // @ts-ignore
    async aggregate<C>(pipeline: object[]): Promise<C[]> {
        const collection = await this.collection()
        // @ts-ignore
        return collection.aggregate<C>(pipeline).toArray()
    }

    // async runTransactionFp<D>(transactionFunction: (session: ClientSession) => Promise<EitherFp<string, D>>): Promise<EitherFp<string, D>> {
    //     const resources = await this.instance.getDatabaseResources()
    //     const session: ClientSession = resources.client.startSession()
    //     session.startTransaction()

    //     try {
    //         return await transactionFunction(session).then(async (value) => {
    //             if(isRight(value)){
    //                 return await session.commitTransaction().then((_) => value)
    //             } else {
    //                 await session.abortTransaction()
    //                 return value
    //             }
    //         })
    //     } catch (e) {
    //         console.log("error caught during Mongo transaction:  " + e.toString())
    //         await session.abortTransaction()
    //         return left<string, D>("transaction error: " + e)
    //     } finally {
    //         await session.endSession()
    //     }
    // }
}