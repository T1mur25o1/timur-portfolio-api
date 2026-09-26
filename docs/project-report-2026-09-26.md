---
title: Timur Portfolio — Project Report
date: 2026-09-26
scope: timur-portfolio-api (Express + MongoDB + static site/admin), timur-portfolio (React CRA)
---

# Timur Portfolio — Project Report (2026-09-26)

## Bottom line first

1. **The app doesn't start on your machine right now.** The MongoDB host in `.env` doesn't resolve (`getaddrinfo ENOTFOUND <atlas-shard-host>.mongodb.net`). Google DNS (8.8.8.8) returns *Non-existent domain* for it. **[Certain]** The Atlas cluster has most likely been deleted or recreated under a new hostname. **[Likely]** If a Render deployment uses the same URI, it's down too. **[Likely, not verified. I don't know the Render URL.]**
2. **One database error takes the whole server down.** The async route handlers aren't wrapped, so under Express 4 a rejected promise is never passed to the error handler. Node then treats it as an unhandled rejection and exits. I reproduced this twice: a simulated Mongo failure on `GET /api/content` killed the process, and so did a login with `JWT_SECRET` unset. **[Certain]** You already wrote the fix (`src/middleware/asyncHandler.js`), but it's **untracked in git and not used anywhere**.
3. **The React project (`timur-portfolio`) is effectively dead code.** The API's `public/` folder re-implements the same site with live content. The React app is hardcoded, isn't under any git repository, its only test fails, and its build fails when `CI=true`. **[Certain for the facts; Likely that it has been superseded]**

Everything else is moderate or low severity. The core code is small, readable and mostly sound. In particular, output escaping on the public site is done correctly.

---

## 1. What the project is

| | `timur-portfolio-api` (the real app) | `timur-portfolio` (React) |
|---|---|---|
| Stack | Node ≥20, Express 4, MongoDB driver 6, JWT + bcryptjs, ESM | Create React App 5, React 19, Tailwind 3, framer-motion, lucide-react |
| Serves | Public site `/`, admin dashboard `/admin.html`, JSON API `/api/*` | Static single page, content hardcoded in JSX |
| Data | One Mongo document `site/_id:"content"` holding hero/about/skills/services/projects/contact. It's seeded automatically when missing | None |
| Auth | One admin password (bcrypt hash in `.env`), 12-hour JWT kept in `localStorage` | n/a |
| Git | Own repo, `main` tracks `origin` (github.com/T1mur25o1/timur-portfolio-api), 1 commit | **No repo.** It shows as untracked (`??`) in the parent ClaudeFiles repo |
| Size | ~440 lines of server JS, ~1,270 lines of front-end JS/HTML | 10 components |

### API surface (verified by running it)

| Method | Route | Auth |
|---|---|---|
| GET | `/health` | public |
| POST | `/api/auth/login` · GET `/api/auth/me` | public · admin |
| GET | `/api/content` (whole document) | public |
| PUT | `/api/content/{hero,about,contact,skills}` | admin |
| GET / POST / PUT / DELETE | `/api/services[/:id]`, `/api/projects[/:id]` (via `collectionFactory`) | GET public, the rest admin |

Architecture: `index.js` mounts the routers and serves `public/` as static files. `mongoStore.js` exposes a lowdb-style `{data, read(), write()}` interface over a single document, and every request reads or writes the whole document.

---

## 2. What I ran and the results

Environment: a Linux sandbox with Node 22.22, plus your Windows machine with Node 24.19. No MongoDB was reachable from the sandbox, so for the functional run I **replaced `mongoStore.js` with an in-memory store that has the same interface**. That tests everything except the Mongo I/O itself. The real store was run on your machine, where it failed on DNS as described above.

| Check | Result |
|---|---|
| `npm ci` (both projects) | ✅ installs cleanly |
| API `npm test` | ✅ 1/1 passed. It only covers `/health` |
| API `npm run lint` | ❌ **68 errors**, all `no-undef` for `document`/`window`/`localStorage` in `public/js/*`. This is a config gap (no browser globals for `public/`), not a code bug. Server code lints clean |
| API `prettier --check` | ⚠️ 5 files unformatted |
| API `npm audit --omit=dev` | ⚠️ 3 moderate (`qs` via express 4.22.2 / body-parser). `npm audit fix` resolves it (express 4.22.3) |
| API smoke test, 27 requests (log below) | ✅ all routes behave as designed: 401 without a token, 401 for a forged `alg:none` token, 404 for unknown ids, 400 for malformed JSON and non-array skills, ids are server-generated (a client-supplied `id` is ignored) |
| API with a real `.env` on your PC | ❌ `ENOTFOUND` on the Atlas host after **~33 s** (driver default server-selection timeout), then exit |
| DB-failure simulation | ❌ **process crashed** (unhandled rejection) |
| Login with `JWT_SECRET` missing | ❌ **process crashed** (`secretOrPrivateKey must have a value`) |
| 30 wrong passwords in a row | ⚠️ all answered 401 with no throttling |
| Browser render (Chromium, Playwright) | ✅ public site: 4 services, 4 projects, no console errors. ✅ admin login and dashboard work. Mobile 390 px: a decorative blob overflows by 34 px but is clipped by `body{overflow-x:hidden}`, so there's no visible scroll in Chromium |
| React `npm test` | ❌ fails: the CRA boilerplate test looks for "learn react", and jsdom has no `canvas.getContext` (MatrixRain) |
| React `npm run build` | ✅ locally (108 kB gzipped JS) with 6 `jsx-a11y/anchor-is-valid` warnings (`href="#"`). ❌ **fails with `CI=true`**, which most CI and hosting build environments set |
| React `npm audit` | ⚠️ 38 (19 high, 10 moderate, 9 low). They're in the CRA toolchain, not the browser bundle **[Likely]** |

Note on the sandbox run: `cdn.tailwindcss.com` and Google Fonts were unreachable there, so I compiled the Tailwind CSS locally with your inline config to take the screenshots. Fonts fell back to system fonts.

<details><summary>Smoke-test log (condensed)</summary>

```
GET /health                                   200  {"status":"ok",...}
GET /api/content                              200
POST /api/auth/login {}                       400  Password is required
POST /api/auth/login wrong                    401  Incorrect password
GET /api/auth/me forged alg:none token        401  Invalid or expired token
PUT /api/content/hero (no token)              401  Missing token
PUT /api/content/skills ["Go","",5,"Rust"]    200  ["Go","Rust"]
POST /api/projects {"id":"attacker-id"}       201  id replaced with UUID
PUT /api/projects/bogus                       404
DELETE twice                                  204 then 404
POST /api/services {}                         201  {"id":"..."}              <- no validation
PUT contact github "javascript:alert(...)"    200  stored and rendered as href <- see F5
PUT hero roles "oops" (string, not array)     200  accepted                  <- no type check
30x wrong password                            401 x30, no 429
Response headers                              X-Powered-By: Express, ACAO: *, no CSP / X-Frame-Options
```
</details>

---

## 3. Findings, ranked

### High

**F1 — An unhandled async error kills the server** **[Certain, reproduced]**
`content.js`, `collectionFactory.js` and `auth.js` use `async` handlers without `asyncHandler`. Under Express 4, a thrown or rejected promise bypasses `errorHandler`, and Node ≥15 exits on unhandled rejections. A single Atlas blip turns into full downtime until the host restarts the process.
*Fix (smallest change):* wrap every async handler with the existing `asyncHandler`, and commit that file. Upgrading to Express 5, which forwards rejected promises natively, also works but is a larger change.

**F2 — The configured database doesn't exist** **[Certain that the host is NXDOMAIN; Likely deleted or recreated]**
Check the Atlas console for the cluster, then update `MONGODB_URI` both locally and on Render. Also consider setting `serverSelectionTimeoutMS: 5000` so startup fails fast instead of hanging for about 30 s.

### Medium

**F3 — No brute-force protection on `/api/auth/login`** **[Certain]**
There's unlimited guessing, and each attempt costs about 100 ms of bcrypt CPU, so it's also a cheap way to load the CPU on a free-tier instance. *Fix:* add `express-rate-limit` on that route (e.g. 5 attempts per 15 minutes per IP).

**F4 — Tailwind Play CDN in production, loaded on the admin page next to a `localStorage` JWT** **[Certain it's loaded; Likely that the Play CDN is meant for development only]**
Any script on `admin.html` can read the admin token. A third-party runtime CSS compiler is therefore part of the trusted computing base for your admin session. It also costs load time on every visit. *Fix:* compile the CSS at build time with the Tailwind CLI (it took under a second here and produced 29 kB), serve it from `public/css/`, and remove the CDN script.

**F5 — Stored `javascript:` URLs** **[Certain, reproduced]**
`esc()` escapes HTML, but it doesn't check URL schemes. The contact links render whatever scheme is saved. This is admin-only, so it's a defence-in-depth issue, but combined with F4 or a stolen token it becomes stored XSS for visitors. *Fix:* allow only `https:`, `http:` and `mailto:` on the server in `PUT /contact` (and optionally again on the client).

### Low

- **F6 — No input validation on writes.** `POST {}` creates an empty card, `roles` can become a string, and arbitrary extra fields are persisted. A small per-route whitelist would cover it. **[Certain]**
- **F7 — Lost updates.** Every write reads and rewrites the whole document, so two admin tabs saving at once overwrite each other. This is acceptable for one owner, and worth knowing. **[Certain from code]**
- **F8 — No security headers.** `X-Powered-By` is exposed and there's no CSP or `X-Frame-Options`. `helmet()` fixes this in one line, but its default CSP will block the inline Tailwind config until F4 is done. **[Certain]**
- **F9 — Wide-open CORS (`*`).** This is harmless here because auth uses a bearer header rather than cookies. The admin UI is same-origin, so CORS could be removed entirely. **[Likely]**
- **F10 — Tooling hygiene.** Lint fails on browser globals, 5 files are unformatted, the `qs` advisory is open, and there's only one test. The in-memory store I used would make a good Jest mock for auth and CRUD tests. **[Certain]**
- **F11 — Cosmetic bug.** In `public/js/icons.js`, the `shield` key draws a warning triangle and `bot` draws a padlock (they reuse the `STAT_ICONS` paths). **[Certain from the SVG paths]**
- **F12 — Placeholder content.** The seed data and the leftover `data/db.json` still contain `github.com/yourhandle` and `linkedin.com/in/yourhandle`, with Telegram empty. I couldn't see what's in the live database. `data/db.json` is a leftover from the lowdb era, is gitignored and unused, and can be deleted. **[Certain for the files]**

### React project (`timur-portfolio`)

It's a hardcoded earlier version of the same design and makes no API calls. It isn't version-controlled, its test fails, and its build fails under CI. **Recommendation: archive it** (to `ClaudeFiles/Archive/`) rather than maintain two sources of truth. If you want to keep React, the better path is to point it at `/api/content` and retire `public/index.html`. Don't keep both.

---

## 4. Suggested order of work

1. Restore or recreate the Atlas cluster and update `MONGODB_URI` (F2). Without this, nothing else matters.
2. Wrap the handlers with `asyncHandler` and commit it (F1). This is about 15 lines.
3. Add a rate limit on login (F3) and a URL-scheme check (F5).
4. Build the Tailwind CSS at build time and add `helmet` (F4, F8).
5. Fix the lint config and `npm audit fix`, and add auth/CRUD tests (F10).
6. Decide what happens to the React project.

## 5. What I did *not* verify

- The live Render deployment (URL unknown) and the contents of your live database.
- Behaviour against a real MongoDB. All functional tests used an in-memory stand-in with the same interface.
- Mobile Safari handling of the 34 px overflow.

No project files were modified. The only thing written is this report.
