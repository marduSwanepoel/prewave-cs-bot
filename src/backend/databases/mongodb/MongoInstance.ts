import {Db, MongoClient} from 'mongodb'

export class MongoInstance {

    private constructor(
        private uri: string,
        private database: string,
        public client: MongoClient,
        public db: Db
    ) {
    }

    static async fromEnv(): Promise<MongoInstance> {
        const {MONGODB_URI, MONGODB_DB} = process.env
        if (!MONGODB_URI || !MONGODB_DB) {
            throw new Error('env variable MONGODB_URI and MONGODB_DB not found')
        }

        return new MongoClient(MONGODB_URI, {
            // connectTimeoutMS: 10000,
            // useUnifiedTopology: false,
            retryWrites: true,
            // ssl: true
        })
            .connect()
            .then((client) => {
                console.log(`connected to db ${MONGODB_DB}`)
                return new MongoInstance(MONGODB_URI, MONGODB_DB, client, client.db(MONGODB_DB))
            })
    }

    //todo remove, async not needed anymore
    async getDatabaseResources(): Promise<Db> {
        return Promise.resolve(this.db)
    }
}