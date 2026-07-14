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
import { errorHandler } from "./middleware/errorHandler.js";
import { initDb } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/content", contentRouter);
app.use("/api/services", servicesRouter);
app.use("/api/projects", projectsRouter);

// Public site + admin dashboard are static files served from /public.
app.use(express.static(path.join(__dirname, "..", "public")));

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
      console.error("Check that MONGODB_URI is set correctly in .env");
      process.exit(1);
    });
}

export default app;
