import { Router } from "express";
import { randomUUID } from "crypto";
import { messageStore } from "../store.js";
import { requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { sanitize, schemas } from "../validate.js";
import { notifyNewMessage } from "../notify.js";

const router = Router();

// 5 messages per hour per IP is plenty for a real person and stops floods.
export const messageLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: "You've sent several messages already — please try again later.",
});

/** Public: contact form submission. */
router.post(
  "/",
  messageLimiter,
  asyncHandler(async (req, res) => {
    // Honeypot: a field hidden from humans. Bots that fill it get a fake
    // success so they don't learn to avoid it.
    if (typeof req.body?.website === "string" && req.body.website.trim() !== "") {
      return res.status(201).json({ ok: true });
    }

    const fields = sanitize(req.body, schemas.message, { required: ["name", "email", "message"] });
    if (fields.message.length < 10) {
      return res.status(400).json({ error: "Message is too short" });
    }

    const message = {
      id: randomUUID(),
      ...fields,
      read: false,
      createdAt: new Date().toISOString(),
    };
    await messageStore.insert(message);
    // Fire-and-forget: don't make the visitor wait on Telegram.
    notifyNewMessage(message);
    res.status(201).json({ ok: true });
  }),
);

/** Admin: inbox. */
router.get(
  "/",
  requireAdmin,
  asyncHandler(async (_req, res) => {
    res.json(await messageStore.list());
  }),
);

router.put(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    if (typeof req.body?.read !== "boolean") {
      return res.status(400).json({ error: "read must be true or false" });
    }
    const found = await messageStore.update(req.params.id, { read: req.body.read });
    if (!found) return res.status(404).json({ error: "Not found" });
    res.json({ ok: true });
  }),
);

router.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const found = await messageStore.remove(req.params.id);
    if (!found) return res.status(404).json({ error: "Not found" });
    res.status(204).end();
  }),
);

export default router;
