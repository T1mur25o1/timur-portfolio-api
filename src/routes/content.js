import { Router } from "express";
import db from "../db.js";
import { requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { sanitize, schemas, rules } from "../validate.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    await db.read();
    res.json(db.data);
  }),
);

/** PUT handler that merges validated fields into one section of the document. */
function updateSection(section) {
  return asyncHandler(async (req, res) => {
    const patch = sanitize(req.body, schemas[section]);
    await db.read();
    db.data[section] = { ...db.data[section], ...patch };
    await db.write();
    res.json(db.data[section]);
  });
}

router.put("/hero", requireAdmin, updateSection("hero"));
router.put("/about", requireAdmin, updateSection("about"));
router.put("/contact", requireAdmin, updateSection("contact"));

router.put(
  "/skills",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const skills = rules.stringArray(60, 40)(req.body?.skills, "skills");
    await db.read();
    db.data.skills = skills;
    await db.write();
    res.json(db.data.skills);
  }),
);

export default router;
