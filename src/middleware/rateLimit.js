/**
 * Minimal fixed-window, in-memory rate limiter (no dependency).
 *
 * Good enough for a single-instance app like this one. If the app is ever
 * scaled to several instances, each keeps its own counters — switch to a
 * shared store (e.g. express-rate-limit + a Mongo/Redis store) at that point.
 *
 * Behind a reverse proxy (Render, etc.) `req.ip` is only the real client IP
 * when Express's "trust proxy" setting is configured — see src/index.js.
 */
export function rateLimit({
  windowMs,
  max,
  message = "Too many requests, please try again later.",
}) {
  const hits = new Map(); // key -> { count, resetAt }

  // Periodically drop expired entries so the map can't grow without bound.
  const sweep = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
  }, windowMs);
  sweep.unref();

  function limiter(req, res, next) {
    const now = Date.now();
    const key = req.ip || "unknown";
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count++;
    if (entry.count > max) {
      res.set("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ error: message });
    }
    next();
  }

  limiter.reset = () => hits.clear(); // used by tests
  return limiter;
}
