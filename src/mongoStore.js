import dns from "dns";
import { MongoClient } from "mongodb";

// Node 18+ prefers IPv6 results by default when resolving DNS. On some
// Windows setups this makes the driver's internal SRV/DNS lookups fail
// with "querySrv ECONNREFUSED" even though a plain `nslookup` (which uses
// a different resolution path) succeeds. Forcing IPv4-first fixes it.
dns.setDefaultResultOrder("ipv4first");

const DOC_ID = "content";

let client;
let db;
let connecting;

/**
 * Connects once and returns the Db handle. Fails fast (10s) instead of the
 * driver's 30s default so a bad MONGODB_URI is reported quickly at startup.
 */
export async function getDb() {
  if (db) return db;
  if (!connecting) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error(
        "MONGODB_URI is not set. Create a free MongoDB Atlas cluster and put its connection string in .env.",
      );
    }
    client = new MongoClient(uri, { serverSelectionTimeoutMS: 10_000 });
    connecting = client
      .connect()
      .then(() => {
        db = client.db(process.env.MONGODB_DB || "portfolio");
        return db;
      })
      .catch((err) => {
        connecting = null; // allow a retry on the next request
        throw err;
      });
  }
  return connecting;
}

/**
 * Same `.data` / `.read()` / `.write()` shape as the old lowdb store, but
 * persisted to a single MongoDB document instead of a local JSON file.
 */
const contentStore = {
  data: null,

  async read() {
    const col = (await getDb()).collection("site");
    const doc = await col.findOne({ _id: DOC_ID });
    this.data = doc ? doc.value : null;
    return this.data;
  },

  async write() {
    const col = (await getDb()).collection("site");
    await col.updateOne({ _id: DOC_ID }, { $set: { value: this.data } }, { upsert: true });
  },
};

/** Contact-form messages, one document per message. */
const messageStore = {
  async insert(message) {
    const col = (await getDb()).collection("messages");
    await col.insertOne({ _id: message.id, ...message });
    return message;
  },
  async list() {
    const col = (await getDb()).collection("messages");
    const docs = await col.find({}).sort({ createdAt: -1 }).limit(500).toArray();
    return docs.map(({ _id, ...rest }) => rest);
  },
  async update(id, patch) {
    const col = (await getDb()).collection("messages");
    const res = await col.updateOne({ _id: id }, { $set: patch });
    return res.matchedCount > 0;
  },
  async remove(id) {
    const col = (await getDb()).collection("messages");
    const res = await col.deleteOne({ _id: id });
    return res.deletedCount > 0;
  },
};

export default { content: contentStore, messages: messageStore };
