/**
 * In-memory store with the same interface as mongoStore.js.
 * Selected with MONGODB_URI=memory — for tests and for running the site
 * locally without a database. Everything is lost when the process exits.
 */
let savedContent = null;
const savedMessages = new Map();

const contentStore = {
  data: null,
  async read() {
    this.data = savedContent ? structuredClone(savedContent) : null;
    return this.data;
  },
  async write() {
    savedContent = structuredClone(this.data);
  },
};

const messageStore = {
  async insert(message) {
    savedMessages.set(message.id, structuredClone(message));
    return message;
  },
  async list() {
    return [...savedMessages.values()]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((m) => structuredClone(m));
  },
  async update(id, patch) {
    if (!savedMessages.has(id)) return false;
    savedMessages.set(id, { ...savedMessages.get(id), ...patch });
    return true;
  },
  async remove(id) {
    return savedMessages.delete(id);
  },
};

/** Test helper: wipe everything. */
export function resetMemoryStore() {
  savedContent = null;
  savedMessages.clear();
  contentStore.data = null;
}

export default { content: contentStore, messages: messageStore };
