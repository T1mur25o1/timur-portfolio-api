import dns from "dns";
import { MongoClient } from "mongodb";

// Node 18+ prefers IPv6 results by default when resolving DNS. On some
// Windows setups this makes the driver's internal SRV/DNS lookups fail
// with "querySrv ECONNREFUSED" even though a plain `nslookup` (which uses
// a different resolution path) succeeds. Forcing IPv4-first fixes it.
dns.setDefaultResultOrder("ipv4first");

const DOC_ID = "content";

let client;
let collection;
let connecting;

async function connect() {
  if (collection) return collection;
  if (!connecting) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error(
        "MONGODB_URI is not set. Create a free MongoDB Atlas cluster and put its connection string in .env."
      );
    }
    client = new MongoClient(uri);
    connecting = client.connect().then(() => {
      const dbName = process.env.MONGODB_DB || "portfolio";
      collection = client.db(dbName).collection("site");
      return collection;
    });
  }
  return connecting;
}

/**
 * Drop-in replacement for the old lowdb-backed store: same `.data` /
 * `.read()` / `.write()` shape, but persisted to a single MongoDB document
 * instead of a local JSON file. Routes elsewhere in the app don't need to
 * know the difference.
 */
const store = {
  data: null,

  async read() {
    const col = await connect();
    const doc = await col.findOne({ _id: DOC_ID });
    this.data = doc ? doc.value : null;
    return this.data;
  },

  async write() {
    const col = await connect();
    await col.updateOne(
      { _id: DOC_ID },
      { $set: { value: this.data } },
      { upsert: true }
    );
  },
};

export default store;
