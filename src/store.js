import mongoStore from "./mongoStore.js";
import memoryStore from "./memoryStore.js";

/**
 * Picks the storage backend once at startup.
 *   MONGODB_URI=memory      -> in-memory (tests / local dev without a DB)
 *   MONGODB_URI=mongodb...  -> MongoDB
 */
const useMemory = process.env.MONGODB_URI === "memory";

if (useMemory && process.env.NODE_ENV === "production") {
  throw new Error(
    "MONGODB_URI=memory is not allowed in production (all edits would be lost on restart).",
  );
}
if (useMemory && process.env.NODE_ENV !== "test") {
  console.warn("[store] Using the IN-MEMORY store — edits are lost when the server stops.");
}

const store = useMemory ? memoryStore : mongoStore;

export const contentStore = store.content;
export const messageStore = store.messages;
