---
title: Timur Portfolio — UI Improvements & Feature Proposals
date: 2026-09-26
based_on: live run + screenshots of timur-portfolio-api (public site + admin), source review
related: "[[project-report-2026-09-26]]"
---

# UI improvements & new features

> **Status 2026-09-26 — implemented (branch `upgrades/hardening-ui-contact`):** crash fix, login rate limit, input/URL validation, security headers, Tailwind CDN removed (compiled CSS), U1 (content embedded server-side + OG tags), U2, U3, U5, U6, U7, U9, U10, U11, F1-lite (source/demo links on projects), F2 (contact form + admin inbox + optional Telegram notify). Also fixed a mobile horizontal overflow and the missing icon sizes (`h-4.5`) in the contact section. 21 API tests. **Still open:** U4 (screenshots / image upload), U8, F1 case-study pages, F3–F8.

## The uncomfortable part first

**The site looks good. What it's missing is evidence.** Every project card is two sentences and some tags. There are no links, no screenshots and no results. The ↗ arrow on each card suggests a click that goes nowhere, because the cards are plain `<div>`s. **[Certain]** A client or recruiter has no way to check any claim on the page. More visual polish won't change that. Proof will.

**Two problems come before any new feature:**
1. The live site is probably down. See the [[project-report-2026-09-26|project report]]: the database host doesn't resolve, and the unhandled-error crash is still there.
2. ~~On Render's free tier, first-time visitors see a blank site for 30–50 s because content is fetched after load.~~ **Correction (2026-09-26):** this was wrong. The HTML is served by the same sleeping Express process, so on a cold start the *whole page* waits 30–50 s, not just the content. Server-rendering (U1) doesn't fix cold starts. The only fixes are a paid instance, a keep-warm ping, or hosting the static site separately. What U1 *does* fix is the extra round-trip, link previews and the "Loading…" flash.

A second strategic point: **the hero sells four different identities at once** (full-stack, security analyst, bot maker, EA developer). The typewriter rotates through them, so someone skimming for five seconds sees one at random. Decide who the page is for (security internships? freelance bot and web clients? both?) and lead with that. Keep the others as secondary services. I can't decide this for you. It's the single choice that most shapes everything below.

---

## A. UI improvements (ranked by impact / effort)

| # | Change | Why | Effort |
|---|---|---|---|
| U1 | **Render content into the HTML on the server.** Express reads the Mongo document and injects it into `index.html` (or embeds it as `<script type="application/json">`). Keep `site.js` for interactivity only | Fixes the blank page on cold start. Link previews (Telegram, LinkedIn) and non-JS crawlers see real content. It also removes the dependency on scroll-reveal JS | M |
| U2 | **Make cards honest.** Either link each project (repo / demo / detail page) or remove the ↗ arrows | A fake affordance erodes trust. **[Certain it's fake today]** | S |
| U3 | **Fix the icon mapping.** `shield` renders a ⚠ warning triangle and `bot` renders a padlock | "Cyber Security Analyst" shown with a warning triangle reads as "danger", which is the wrong message for a security portfolio **[Certain]** | S |
| U4 | **Replace the icon-only project thumbnails with real screenshots** (or a terminal/backtest capture) | 160 px of empty space per card is currently spent on a single icon | S (M with image upload, see F5) |
| U5 | **Hide empty or placeholder contact channels.** Right now Telegram is empty but still rendered, and GitHub and LinkedIn point to `yourhandle` | A broken contact link on a portfolio costs you leads **[Certain from code and data]** | S |
| U6 | **Respect `prefers-reduced-motion`** for the matrix rain, skills marquee and typewriter, and pause the canvas when the tab is hidden | There's currently no reduced-motion handling **[Certain]**. That's an accessibility issue, and the canvas also drains battery on phones | S |
| U7 | **Contrast.** `text-slate-500` small text measures 4.28:1 on the page background and 3.97:1 on cards, below the AA minimum of 4.5:1. The `slate-600` arrows measure 2.5:1, below 3:1 | Measured **[Certain]**. Use `slate-400` (7.9:1) for labels and metadata | S |
| U8 | **Skills: switch from the moving marquee to a grouped static grid** (Web · Security · Automation · Trading), with each skill optionally linked to the project where it was used | A moving list can't be scanned, and it's the section recruiters actually scan | S |
| U9 | **Remove the gear icon in the footer that links to `/admin.html`.** Bookmark the admin page instead | It advertises your login page to every visitor, and that login currently has no rate limit | S |
| U10 | **Add a favicon and an Open Graph image and tags** (`og:title`, `og:image`) | The tab icon is currently blank (`data:,`), and shared links show no preview image | S |
| U11 | **Make the "About" JSON card editable.** `major`, `university` and `status: "available"` are hardcoded in `site.js` | You can't mark yourself "not available" without a code change | S |
| U12 | **Loading and error states.** Show skeleton cards, and replace the current failure message (which is written into the hero badge) with a proper fallback | Only matters if you skip U1 | S |

## B. New features (ranked by value to the goal: get contacted / hired)

**F1 — Project case studies.** *Highest value.*
Add these fields to each project: `repoUrl`, `demoUrl`, `images[]`, `featured`, `year`, and a short **Problem → Approach → Result** write-up. Each project gets a detail page at `/projects/:slug` (server-rendered, see U1). It turns claims into evidence. Your real projects already have material: the MT5 MCP server, the trading research platform, the GNS3 labs and the Telegram bots.

**F2 — A contact form that notifies you through a Telegram bot.**
Form → `POST /api/messages` → saved in Mongo → your Telegram bot sends you the message instantly. Protect it with a honeypot field and a rate limit. It showcases one of your advertised skills on your own site, and you won't miss leads because a visitor had no mail client set up (today the only channel is `mailto:`).

**F3 — Real trading evidence.**
You already parse MT5 tester reports with your MCP server. Show the metrics that come out of them (profit factor, max drawdown, trade count, equity curve) on the EA project. **Risk:** only show backtests, label them clearly as such, and add a past-performance disclaimer. Presenting them as live results would be misleading.

**F4 — CV download and an availability status.**
Upload a PDF in the admin panel, and show a status of available / open to internships / busy that you control from admin (this replaces the hardcoded `status` from U11).

**F5 — Admin upgrades.** Build these as F1 needs them, not all up front:
- Image upload for project screenshots. Store images in Mongo GridFS or Cloudinary's free tier, not on local disk, because Render's filesystem is wiped on each deploy.
- Drag-to-reorder cards and a "featured" toggle.
- Export and import the content as JSON. That's a one-click backup, which matters because a deleted cluster just took your content with it.
- Change history with undo, which also covers the lost-update problem.
- A warning before the 12-hour session expires, so you don't lose unsaved edits.

**F6 — Writeups / blog** (security notes, CTF writeups, lab walkthroughs).
These are Markdown posts managed in admin. It's the strongest credibility signal for security roles, but only if you'll actually write them. An empty blog is worse than no blog. **[Guessing on whether you'd keep it up]**

**F7 — Multilingual EN / RU / UZ.**
Only worth doing if local clients are part of your audience. It doubles the content you maintain, so decide on your audience first.

**F8 — Privacy-friendly analytics** (self-hosted Umami, or a tiny page-view counter in your own API).
Without it you can't tell whether any of the above works. Track page views, project clicks and contact submissions.

---

## Recommended order

1. **Fix the foundation.** Restore the DB, apply the crash fix, and add a login rate limit. These come from the report.
2. **Quick UI wins:** U2, U3, U5, U6, U7, U9, U10. That's roughly one evening of small edits.
3. **U1 server rendering.** It fixes cold-start blanks, previews and SEO in one change.
4. **F1 case studies + F2 Telegram contact form.** This is the core value.
5. F3 and F4 next. F6, F7 and F8 only once there's traffic to justify them.

What I'd hold off on: a redesign, a React rewrite, dark/light theme toggles, or more animations. None of them addresses the actual gap, which is evidence and reachability.
