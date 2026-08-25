import { MongoClient, Db } from "mongodb";

const uri = process.env.DATABASE_URL || "mongodb+srv://ajaymrski077_db_user:8KgKzy87jS8L7dlj@cluster0.69k13ax.mongodb.net/mistersk_seo?retryWrites=true&w=majority&appName=Cluster0";

const globalForMongo = global as unknown as {
  _mongoClientPromise?: Promise<MongoClient>;
  _mongoDb?: Db;
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!globalForMongo._mongoClientPromise) {
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
    });
    globalForMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalForMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 8000,
  });
  clientPromise = client.connect();
}

export async function getDb(): Promise<Db> {
  const c = await clientPromise;
  return c.db("mistersk_seo");
}

export default clientPromise;
