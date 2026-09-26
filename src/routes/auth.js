import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { requireAdmin } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { rateLimit } from "../middleware/rateLimit.js";

const router = Router();

// 10 login attempts per 15 minutes per IP. Slows password guessing to a
// crawl and caps how much bcrypt CPU an attacker can burn.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts. Try again in a few minutes.",
});

router.post(
  "/login",
  loginLimiter,
  asyncHandler(async (req, res) => {
    const { password } = req.body || {};
    if (!password || typeof password !== "string") {
      return res.status(400).json({ error: "Password is required" });
    }

    const hash = process.env.ADMIN_PASSWORD_HASH;
    const secret = process.env.JWT_SECRET;
    if (!hash || !secret) {
      console.error("Login attempted but ADMIN_PASSWORD_HASH and/or JWT_SECRET is not set.");
      return res.status(500).json({ error: "Admin login is not configured on the server" });
    }

    const ok = await bcrypt.compare(password, hash);
    if (!ok) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    const token = jwt.sign({ role: "admin" }, secret, { expiresIn: "12h" });
    res.json({ token });
  }),
);

router.get("/me", requireAdmin, (req, res) => {
  res.json({ ok: true, role: "admin", exp: req.admin.exp });
});

export default router;
