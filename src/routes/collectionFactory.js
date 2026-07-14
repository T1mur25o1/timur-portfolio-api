import { Router } from "express";
import { randomUUID } from "crypto";
import db from "../db.js";
import { requireAdmin } from "../middleware/auth.js";

/**
 * Builds a small CRUD router over a top-level array collection in the
 * lowdb store (e.g. db.data.services / db.data.projects).
 *
 * GET    /          -> public, list all items
 * POST   /          -> admin, create item
 * PUT    /:id       -> admin, update item
 * DELETE /:id       -> admin, delete item
 */
export function createCollectionRouter(collectionKey) {
  const router = Router();

  router.get("/", async (_req, res) => {
    await db.read();
    res.json(db.data[collectionKey] || []);
  });

  router.post("/", requireAdmin, async (req, res) => {
    await db.read();
    const item = { ...req.body, id: randomUUID() };
    db.data[collectionKey].push(item);
    await db.write();
    res.status(201).json(item);
  });

  router.put("/:id", requireAdmin, async (req, res) => {
    await db.read();
    const list = db.data[collectionKey];
    const idx = list.findIndex((entry) => entry.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: "Not found" });
    }
    list[idx] = { ...list[idx], ...req.body, id: req.params.id };
    await db.write();
    res.json(list[idx]);
  });

  router.delete("/:id", requireAdmin, async (req, res) => {
    await db.read();
    const before = db.data[collectionKey].length;
    db.data[collectionKey] = db.data[collectionKey].filter(
      (entry) => entry.id !== req.params.id
    );
    if (db.data[collectionKey].length === before) {
      return res.status(404).json({ error: "Not found" });
    }
    await db.write();
    res.status(204).end();
  });

  return router;
}
