import { Router } from "express";
import { randomUUID } from "crypto";
import db from "../db.js";
import { requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { sanitize } from "../validate.js";

/**
 * Builds a small CRUD router over a top-level array collection in the
 * content document (e.g. db.data.services / db.data.projects).
 *
 * GET    /          -> public, list all items
 * POST   /          -> admin, create item   (validated against `schema`)
 * PUT    /:id       -> admin, update item   (validated, partial update)
 * DELETE /:id       -> admin, delete item
 */
export function createCollectionRouter(collectionKey, schema) {
  const router = Router();

  router.get(
    "/",
    asyncHandler(async (_req, res) => {
      await db.read();
      res.json(db.data[collectionKey] || []);
    }),
  );

  router.post(
    "/",
    requireAdmin,
    asyncHandler(async (req, res) => {
      const fields = sanitize(req.body, schema, { required: ["title"] });
      await db.read();
      const item = { ...fields, id: randomUUID() };
      db.data[collectionKey] = [...(db.data[collectionKey] || []), item];
      await db.write();
      res.status(201).json(item);
    }),
  );

  router.put(
    "/:id",
    requireAdmin,
    asyncHandler(async (req, res) => {
      const fields = sanitize(req.body, schema);
      if (fields.title === "") return res.status(400).json({ error: "title is required" });
      await db.read();
      const list = db.data[collectionKey] || [];
      const idx = list.findIndex((entry) => entry.id === req.params.id);
      if (idx === -1) {
        return res.status(404).json({ error: "Not found" });
      }
      list[idx] = { ...list[idx], ...fields, id: req.params.id };
      await db.write();
      res.json(list[idx]);
    }),
  );

  router.delete(
    "/:id",
    requireAdmin,
    asyncHandler(async (req, res) => {
      await db.read();
      const list = db.data[collectionKey] || [];
      const next = list.filter((entry) => entry.id !== req.params.id);
      if (next.length === list.length) {
        return res.status(404).json({ error: "Not found" });
      }
      db.data[collectionKey] = next;
      await db.write();
      res.status(204).end();
    }),
  );

  return router;
}
