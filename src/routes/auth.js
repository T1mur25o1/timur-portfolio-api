import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { requireAdmin } from "../middleware/auth.js";

const router = Router();

router.post("/login", async (req, res) => {
  const { password } = req.body || {};
  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }

  const hash = process.env.ADMIN_PASSWORD_HASH;
  if (!hash) {
    return res
      .status(500)
      .json({ error: "Admin password is not configured on the server (ADMIN_PASSWORD_HASH)" });
  }

  const ok = await bcrypt.compare(password, hash);
  if (!ok) {
    return res.status(401).json({ error: "Incorrect password" });
  }

  const token = jwt.sign({ role: "admin" }, process.env.JWT_SECRET, {
    expiresIn: "12h",
  });
  res.json({ token });
});

router.get("/me", requireAdmin, (_req, res) => {
  res.json({ ok: true, role: "admin" });
});

export default router;
