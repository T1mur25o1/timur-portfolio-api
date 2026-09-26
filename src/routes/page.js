import { Router } from "express";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import db from "../db.js";

/**
 * Serves the public site's index.html with two things filled in server-side:
 *
 * 1. The site content, embedded as JSON, so the page renders without a
 *    second round-trip to /api/content.
 * 2. Absolute Open Graph URLs + the hero description, so link previews
 *    (Telegram, LinkedIn, etc.) show real content.
 *
 * If the database is unreachable the page is still served; site.js then
 * falls back to fetching /api/content and shows its own error state.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = path.join(__dirname, "..", "..", "public", "index.html");

let cachedTemplate;
async function getTemplate() {
  // Re-read on every request in development so HTML edits show up immediately.
  if (cachedTemplate && process.env.NODE_ENV === "production") return cachedTemplate;
  cachedTemplate = await fs.readFile(TEMPLATE_PATH, "utf8");
  return cachedTemplate;
}

const escapeAttr = (s) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c],
  );

// JSON inside <script> must not contain "</script>" or U+2028/2029.
const safeJson = (value) =>
  JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");

function siteOrigin(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/+$/, "");
  return `${req.protocol}://${req.get("host")}`;
}

const router = Router();

router.get(["/", "/index.html"], async (req, res, next) => {
  try {
    let template = await getTemplate();
    let content = null;
    try {
      await db.read();
      content = db.data;
    } catch (err) {
      console.error("[page] Could not load content for server render:", err.message);
    }

    const origin = siteOrigin(req);
    const description = content?.hero?.description || "";
    const html = template
      .replaceAll("__SITE_ORIGIN__", escapeAttr(origin))
      .replace("__OG_DESCRIPTION__", escapeAttr(description.slice(0, 300)))
      .replace(
        "<!--INITIAL_CONTENT-->",
        content
          ? `<script id="initial-content" type="application/json">${safeJson(content)}</script>`
          : "",
      );

    res.set("Cache-Control", "no-cache");
    res.type("html").send(html);
  } catch (err) {
    next(err);
  }
});

export default router;
