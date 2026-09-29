import { MongoClient } from "mongodb";

// Reuses one connection across requests. Fails fast (5s) instead of hanging 30s.
export async function getDb() {
  const uri = (process.env.MONGODB_URI || "").trim();
  if (!uri || uri.includes("USER:PASSWORD")) throw new Error("MONGODB_URI is missing or still the placeholder");
  if (!global._mongoClient) {
    global._mongoClient = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 }).connect().catch((e) => {
      global._mongoClient = null; // do not cache a failed connection
      throw e;
    });
  }
  const client = await global._mongoClient;
  return client.db((process.env.MONGODB_DB || "portfolio").trim());
}
