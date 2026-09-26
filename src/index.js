import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import healthRouter from "./routes/health.js";
import authRouter from "./routes/auth.js";
import contentRouter from "./routes/content.js";
import servicesRouter from "./routes/services.js";
import projectsRouter from "./routes/projects.js";
import messagesRouter from "./routes/messages.js";
import pageRouter from "./routes/page.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { securityHeaders } from "./middleware/securityHeaders.js";
import { initDb } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Behind Render's (or any) reverse proxy, req.ip is the proxy's address unless
// Express is told how many proxy hops to trust. Rate limiting depends on this.
// Default: 1 hop in production, none locally. Override with TRUST_PROXY.
app.set(
  "trust proxy",
  Number(process.env.TRUST_PROXY ?? (process.env.NODE_ENV === "production" ? 1 : 0)),
);
app.disable("x-powered-by");

app.use(securityHeaders);
app.use(cors());
app.use(express.json({ limit: "100kb" }));

app.use("/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/content", contentRouter);
app.use("/api/services", servicesRouter);
app.use("/api/projects", projectsRouter);
app.use("/api/messages", messagesRouter);

// Public site: index.html is rendered with embedded content; everything
// else (admin.html, css, js, images) is served as static files.
app.use(pageRouter);
app.use(express.static(path.join(__dirname, "..", "public"), { index: false }));

app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));
app.use(errorHandler);

if (process.env.NODE_ENV !== "test") {
  initDb()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`Server listening on port ${PORT}`);
        console.log(`  Public site: http://localhost:${PORT}/`);
        console.log(`  Admin panel: http://localhost:${PORT}/admin.html`);
      });
    })
    .catch((err) => {
      console.error("Failed to connect to the database:", err.message);
      console.error(
        "Check that MONGODB_URI is set correctly in .env (or use MONGODB_URI=memory for a local test run)",
      );
      process.exit(1);
    });
}

export default app;
