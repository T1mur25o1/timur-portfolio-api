# Timur Portfolio — Full-Stack (API + Admin + Public Site)

A single Express server that serves:

- **Public site** (`/`) — your portfolio, rendering content fetched live from the API.
- **Admin dashboard** (`/admin.html`) — password-protected page to add/edit/delete everything shown on the public site: hero text, about section, skills, services, projects, and contact links.
- **JSON API** (`/api/...`) — backs both pages. `GET` routes are public; `POST`/`PUT`/`DELETE` routes require an admin JWT.

Content is stored in MongoDB (one document holding hero/about/skills/services/projects/contact), created automatically with the site's original content the first time the server connects to an empty database. Using a hosted database instead of a local file means the app has no persistent-disk requirement, so it can run on free-tier hosts like Render.

## Setup

```powershell
npm install
copy .env.example .env
```

Open `.env` and set:
- `MONGODB_URI` — connection string for a MongoDB database. The free tier of [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) works well: create a free (M0) cluster, add a database user, allow network access from anywhere (`0.0.0.0/0`) so hosts like Render can reach it, then copy the connection string from **Connect → Drivers**.
- `JWT_SECRET` — any long random string.
- `ADMIN_PASSWORD_HASH` — generate with:
  ```powershell
  node scripts/hash-password.js "your-chosen-password"
  ```
  Paste the printed hash into `.env`.

## Run

```powershell
npm run dev
```

Then open:
- Public site: http://localhost:3000/
- Admin panel: http://localhost:3000/admin.html (sign in with the password you hashed above)

## What the admin can do

- **Hero** — badge text, name, the rotating role list, intro paragraph.
- **About** — eyebrow label, heading, paragraph, and the 4 stat cards.
- **Skills** — add/remove the scrolling skill chips.
- **Services** — add, edit, delete service cards (title, subtitle, description, tags, icon, accent color).
- **Projects** — add, edit, delete project cards (same fields, plus category).
- **Contact** — email, Telegram, GitHub, LinkedIn links.

Everything saves immediately to MongoDB and is reflected on the public site on next page load/refresh (no rebuild needed).

## Structure

```
src/
  index.js              Express app entry point, mounts routes + serves /public
  db.js                 Default seed content + initDb()
  mongoStore.js         MongoDB-backed store (data/read/write), used by db.js and all routes
  routes/
    health.js           GET /health
    auth.js              POST /api/auth/login, GET /api/auth/me
    content.js           GET/PUT hero, about, contact, skills
    services.js          CRUD /api/services (via collectionFactory)
    projects.js          CRUD /api/projects (via collectionFactory)
    collectionFactory.js Shared CRUD router builder for array collections
  middleware/
    auth.js              requireAdmin — verifies JWT bearer token
    errorHandler.js       Centralized error handler
scripts/
  hash-password.js       CLI helper to bcrypt-hash your admin password
public/
  index.html             Public site shell (content filled in by js/site.js)
  admin.html              Admin dashboard shell (filled in by js/admin.js)
  css/site.css            Shared styling (dark/neon theme, animations)
  js/site.js               Fetches /api/content, renders the public site
  js/admin.js               Login + CRUD dashboard logic
  js/matrix.js              Shared "matrix rain" canvas effect
  js/icons.js                Fixed icon/color presets used by services & projects
```

## Notes

- Auth is intentionally simple: **one** admin password (bcrypt-hashed, stored in `.env`), not a full user-accounts system — appropriate for a single-owner portfolio site. Admin sessions are JWTs valid for 12 hours, stored in the browser's `localStorage`.
- Icons and accent colors for services/projects are picked from a small fixed set (`public/js/icons.js`) rather than free-form HTML, so admin-entered content can never inject arbitrary markup into the public page.
- See `DEPLOY.md` for how to put this online for free (Render + MongoDB Atlas).
