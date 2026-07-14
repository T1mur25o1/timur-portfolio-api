import { Router } from "express";
import db from "../db.js";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.get("/", async (_req, res) => {
  await db.read();
  res.json(db.data);
});

router.put("/hero", requireAdmin, async (req, res) => {
  await db.read();
  db.data.hero = { ...db.data.hero, ...req.body };
  await db.write();
  res.json(db.data.hero);
});

router.put("/about", requireAdmin, async (req, res) => {
  await db.read();
  db.data.about = { ...db.data.about, ...req.body };
  await db.write();
  res.json(db.data.about);
});

router.put("/contact", requireAdmin, async (req, res) => {
  await db.read();
  db.data.contact = { ...db.data.contact, ...req.body };
  await db.write();
  res.json(db.data.contact);
});

router.put("/skills", requireAdmin, async (req, res) => {
  const { skills } = req.body || {};
  if (!Array.isArray(skills)) {
    return res.status(400).json({ error: "skills must be an array of strings" });
  }
  await db.read();
  db.data.skills = skills.filter((s) => typeof s === "string" && s.trim().length > 0);
  await db.write();
  res.json(db.data.skills);
});

export default router;
