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
- Admin panel: http://localhost:3000/admin.html (sign in with the password you hashed above — there is intentionally no link to it on the public site)

No database handy? `npm run dev:memory` runs everything against an in-memory store (content resets on restart).

## Styling (Tailwind)

Tailwind is compiled ahead of time into `public/css/tailwind.css` (no CDN, so the site works with a strict Content-Security-Policy). **After adding or changing Tailwind classes in `public/**`, run:**

```powershell
npm run build:css
```

and commit the updated `public/css/tailwind.css`. The host serves it as a static file — no build step on deploy.

## Tests

```powershell
npm test      # API tests (in-memory store; no database or network needed)
npm run lint
```

## What the admin can do

- **Hero** — badge text, name, the rotating role list, intro paragraph.
- **About** — eyebrow label, heading, paragraph, the 4 stat cards, and the `about.json` card (major, university, availability status).
- **Skills** — add/remove the scrolling skill chips.
- **Services** — add, edit, delete service cards (title, subtitle, description, tags, icon, accent color).
- **Projects** — add, edit, delete project cards (same fields, plus category and optional source/demo URLs, shown as buttons on the card).
- **Contact** — email, Telegram, GitHub, LinkedIn links. Empty links are hidden on the site; placeholder values (`yourhandle`, `example.com`) are flagged in the admin.
- **Messages** — inbox for the public contact form (mark read/unread, delete). Optional instant Telegram notification: set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` (see `.env.example`).

Everything saves immediately to MongoDB and is reflected on the public site on next page load/refresh (no rebuild needed).

## Structure

```
src/
  index.js              Express app entry point, mounts routes + serves /public
  db.js                 Default seed content + initDb()
  store.js              Picks the storage backend (MongoDB, or in-memory when MONGODB_URI=memory)
  mongoStore.js         MongoDB-backed store: site content document + contact messages
  memoryStore.js        In-memory store with the same interface (tests / local dev)
  validate.js           Input validation schemas (field whitelist, types, lengths, http(s)-only URLs)
  notify.js             Optional Telegram notification for new contact messages
  routes/
    health.js           GET /health
    auth.js              POST /api/auth/login, GET /api/auth/me
    content.js           GET/PUT hero, about, contact, skills
    services.js          CRUD /api/services (via collectionFactory)
    projects.js          CRUD /api/projects (via collectionFactory)
    collectionFactory.js Shared CRUD router builder for array collections
    messages.js          POST /api/messages (public, rate-limited, honeypot) + admin inbox
    page.js              Serves index.html with the content embedded + Open Graph tags
  middleware/
    auth.js              requireAdmin — verifies JWT bearer token
    errorHandler.js       Centralized error handler (generic message for 5xx)
    asyncHandler.js       Forwards async route errors to the error handler (prevents crashes)
    rateLimit.js          In-memory rate limiter (login: 10/15 min, contact form: 5/hour per IP)
    securityHeaders.js    CSP, X-Frame-Options, nosniff, Referrer-Policy
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
- Login is rate-limited per IP. On Render this relies on `trust proxy` (defaults to 1 hop when `NODE_ENV=production`; override with `TRUST_PROXY`).
- Icons and accent colors for services/projects are picked from a small fixed set (`public/js/icons.js`) rather than free-form HTML, so admin-entered content can never inject arbitrary markup into the public page.
- See `DEPLOY.md` for how to put this online for free (Render + MongoDB Atlas).
