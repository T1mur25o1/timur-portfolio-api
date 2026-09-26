export function errorHandler(err, _req, res, _next) {
  const status = err.status || err.statusCode || 500;

  // 4xx errors raised on purpose (validation, bad JSON) are safe to show.
  // 5xx errors may contain internals (DB hostnames, stack details): log them,
  // but send the client a generic message.
  if (status >= 500) {
    console.error(err.stack || err);
    return res.status(status).json({ error: "Internal Server Error" });
  }
  res.status(status).json({ error: err.message || "Bad Request" });
}
