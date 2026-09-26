import { startMatrixRain } from "./matrix.js";
import { iconSvg, colorSet } from "./icons.js";

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const CAP_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10 12 5 2 10l10 5 10-5Z"/><path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5"/></svg>';
const STAT_ICONS = [iconSvg("code"), iconSvg("shield"), CAP_ICON, iconSvg("chart")];

const LINK_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17 17 7M7 7h10v10"/></svg>';
const CODE_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>';

function esc(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

/** Only http(s)/mailto links are rendered — defence in depth on top of server validation. */
function safeHref(url, { allowMailto = false } = {}) {
  try {
    const u = new URL(url);
    if (
      u.protocol === "https:" ||
      u.protocol === "http:" ||
      (allowMailto && u.protocol === "mailto:")
    )
      return u.href;
  } catch {
    /* invalid URL */
  }
  return "";
}

// --- Navbar scroll state + mobile menu -------------------------------
const navbar = document.getElementById("navbar");
window.addEventListener(
  "scroll",
  () => {
    const scrolled = window.scrollY > 24;
    navbar.classList.toggle("glass", scrolled);
    navbar.classList.toggle("shadow-glow", scrolled);
    navbar.classList.toggle("py-3", scrolled);
    navbar.classList.toggle("py-5", !scrolled);
  },
  { passive: true },
);

const menuBtn = document.getElementById("menu-btn");
const mobileMenu = document.getElementById("mobile-menu");
menuBtn.addEventListener("click", () => {
  const open = mobileMenu.classList.toggle("hidden") === false;
  menuBtn.setAttribute("aria-expanded", String(open));
});
mobileMenu.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    mobileMenu.classList.add("hidden");
    menuBtn.setAttribute("aria-expanded", "false");
  }),
);

// --- Footer year --------------------------------------------------------
document.getElementById("footer-year").textContent =
  "© " +
  new Date().getFullYear() +
  " Timur — Full-Stack Dev · Security Analyst · Bot Maker · EA Developer";

// --- Matrix rain (skipped when the OS asks for reduced motion) -------------
if (!reduceMotion) startMatrixRain(document.getElementById("matrix-canvas"));

// --- Scroll reveal --------------------------------------------------------
function initReveal() {
  const els = document.querySelectorAll(".reveal");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    els.forEach((el) => el.classList.add("in-view"));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 },
  );
  els.forEach((el) => io.observe(el));
}

// --- Typewriter -------------------------------------------------------
function startTypewriter(roles) {
  const el = document.getElementById("typewriter");
  const list = Array.isArray(roles) ? roles.filter(Boolean) : [];
  if (list.length === 0) return;
  if (reduceMotion) {
    el.textContent = list.join(" · ");
    return;
  }
  let roleIndex = 0,
    charIndex = 0,
    deleting = false;
  function tick() {
    const current = list[roleIndex % list.length];
    if (!deleting && charIndex <= current.length) {
      el.textContent = current.slice(0, charIndex);
      charIndex++;
      setTimeout(tick, 70);
    } else if (!deleting && charIndex > current.length) {
      deleting = true;
      setTimeout(tick, 1400);
    } else if (deleting && charIndex >= 0) {
      el.textContent = current.slice(0, charIndex);
      charIndex--;
      setTimeout(tick, 35);
    } else {
      deleting = false;
      roleIndex++;
      charIndex = 0;
      setTimeout(tick, 200);
    }
  }
  tick();
}

// --- Render sections from content data ----------------------------------
function renderHero(hero) {
  document.getElementById("hero-badge-text").textContent = hero.badge || "";
  document.getElementById("hero-name").textContent = hero.name || "Timur";
  document.getElementById("hero-description").textContent = hero.description || "";
  startTypewriter(hero.roles);
}

function renderAbout(about, hero) {
  document.getElementById("about-eyebrow").textContent = about.eyebrow || "Whoami";
  document.getElementById("about-heading").textContent = about.heading || "";
  document.getElementById("about-paragraph").textContent = about.paragraph || "";

  const major = about.major || "Cyber Security";
  const university = about.university || "New Uzbekistan University";
  document.getElementById("about-affiliation").textContent = `${major} @ ${university}`;

  const stats = about.stats || [];
  document.getElementById("about-stats").innerHTML = stats
    .map(
      (stat, i) => `
      <div class="glass glow-card rounded-2xl p-4 transition-transform hover:-translate-y-1">
        <span class="h-5 w-5 text-neon-violet inline-block">${STAT_ICONS[i % STAT_ICONS.length]}</span>
        <div class="mt-2 font-display text-lg font-semibold text-white">${esc(stat.value)}</div>
        <div class="font-mono text-xs text-slate-400">${esc(stat.label)}</div>
      </div>`,
    )
    .join("");

  document.getElementById("about-json").textContent = JSON.stringify(
    {
      name: hero.name || "Timur",
      major,
      university,
      status: about.status || "available",
    },
    null,
    2,
  );
}

function tagList(tags) {
  return (tags || [])
    .map(
      (t) =>
        `<span class="rounded-full border border-slate-700 px-3 py-1 font-mono text-[11px] text-slate-400">${esc(t)}</span>`,
    )
    .join("");
}

function serviceCard(item) {
  const c = colorSet(item.color);
  return `
    <div class="reveal in-view group glow-card relative overflow-hidden rounded-2xl border border-slate-800 bg-void-800/60 p-7 transition-colors ${c.border}">
      <div class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br ${c.grad} blur-2xl transition-transform duration-500 group-hover:scale-125"></div>
      <div class="relative">
        <span class="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700 bg-void-900 ${c.text}">${iconSvg(item.icon)}</span>
        <h3 class="mt-5 font-display text-xl font-semibold text-white">${esc(item.title)}</h3>
        <p class="mt-1 font-mono text-xs ${c.text}">${esc(item.subtitle)}</p>
        <p class="mt-4 text-sm leading-relaxed text-slate-400">${esc(item.description)}</p>
        <div class="mt-5 flex flex-wrap gap-2">${tagList(item.tags)}</div>
      </div>
    </div>`;
}

function projectCard(item) {
  const c = colorSet(item.color);
  const demo = safeHref(item.demoUrl);
  const repo = safeHref(item.repoUrl);
  const links = [
    demo &&
      `<a class="project-link" href="${esc(demo)}" target="_blank" rel="noopener noreferrer">${LINK_ICON}Live demo</a>`,
    repo &&
      `<a class="project-link" href="${esc(repo)}" target="_blank" rel="noopener noreferrer">${CODE_ICON}Source</a>`,
  ].filter(Boolean);

  return `
    <article class="reveal in-view group relative flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-void-800/50 transition-all hover:-translate-y-1 ${c.border}">
      <div class="flex h-40 items-center justify-center border-b border-slate-800 bg-gradient-to-br from-void-900 to-void-800">
        <span class="h-12 w-12 ${c.text} opacity-80 transition-transform duration-500 group-hover:scale-110 inline-block">${iconSvg(item.icon)}</span>
      </div>
      <div class="flex flex-1 flex-col p-6">
        <span class="font-mono text-xs ${c.text}">${esc(item.category)}</span>
        <h3 class="mt-2 font-display text-lg font-semibold text-white">${esc(item.title)}</h3>
        <p class="mt-2 text-sm text-slate-400">${esc(item.description)}</p>
        <div class="mt-4 flex flex-wrap gap-2">${tagList(item.tags)}</div>
        ${links.length ? `<div class="mt-auto flex flex-wrap gap-3 pt-5">${links.join("")}</div>` : ""}
      </div>
    </article>`;
}

function renderServices(services) {
  document.getElementById("services-grid").innerHTML = (services || []).map(serviceCard).join("");
}

function renderProjects(projects) {
  document.getElementById("projects-grid").innerHTML = (projects || []).map(projectCard).join("");
}

function renderSkills(skills) {
  const list = skills || [];
  // The marquee needs two copies to loop seamlessly; a static list needs one.
  const items = reduceMotion ? list : [...list, ...list];
  document.getElementById("skills-track").innerHTML = items
    .map(
      (s) =>
        `<span class="glass whitespace-nowrap rounded-full border border-slate-800 px-5 py-2.5 font-mono text-sm text-slate-300"><span class="mr-2 text-neon-cyan">&#9657;</span>${esc(s)}</span>`,
    )
    .join("");
}

const CHANNEL_ICONS = {
  email:
    '<svg xmlns="http://www.w3.org/2000/svg" class="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg>',
  telegram:
    '<svg xmlns="http://www.w3.org/2000/svg" class="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M21.94 4.6 3.6 11.86c-1.24.5-1.23 1.19-.22 1.5l4.7 1.47 1.8 5.5c.22.6.4.85.82.85.4 0 .58-.18.8-.4l1.94-1.87 4.03 2.97c.74.41 1.28.2 1.47-.68l2.66-12.5c.28-1.1-.42-1.6-1.06-1.2Z"/></svg>',
  github:
    '<svg xmlns="http://www.w3.org/2000/svg" class="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.73.5.98 5.24.98 11.52c0 4.94 3.2 9.13 7.65 10.6.56.1.76-.24.76-.54 0-.27-.01-1.15-.02-2.09-3.11.68-3.77-1.34-3.77-1.34-.5-1.29-1.24-1.63-1.24-1.63-1.01-.7.08-.68.08-.68 1.12.08 1.71 1.16 1.71 1.16.99 1.71 2.6 1.21 3.24.93.1-.72.39-1.21.71-1.49-2.49-.28-5.1-1.24-5.1-5.55 0-1.23.44-2.23 1.16-3.02-.12-.28-.5-1.42.11-2.96 0 0 .95-.3 3.1 1.16.9-.25 1.87-.37 2.83-.38.96 0 1.93.13 2.83.38 2.15-1.46 3.1-1.16 3.1-1.16.61 1.54.23 2.68.11 2.96.72.79 1.16 1.79 1.16 3.02 0 4.32-2.62 5.27-5.11 5.55.4.35.76 1.03.76 2.08 0 1.5-.01 2.71-.01 3.08 0 .3.2.65.77.54 4.44-1.48 7.64-5.66 7.64-10.6C23.02 5.24 18.27.5 12 .5Z"/></svg>',
  linkedin:
    '<svg xmlns="http://www.w3.org/2000/svg" class="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z"/></svg>',
};

function renderContact(contact) {
  const email = (contact.email || "").trim();
  const channels = [
    {
      key: "email",
      label: "Email",
      href: email ? safeHref(`mailto:${email}`, { allowMailto: true }) : "",
      value: email,
    },
    {
      key: "telegram",
      label: "Telegram",
      href: safeHref(contact.telegram),
      value: (contact.telegram || "").replace(/^https?:\/\/t\.me\//, "@"),
    },
    {
      key: "github",
      label: "GitHub",
      href: safeHref(contact.github),
      value: (contact.github || "").replace(/^https?:\/\//, ""),
    },
    {
      key: "linkedin",
      label: "LinkedIn",
      href: safeHref(contact.linkedin),
      value: (contact.linkedin || "").replace(/^https?:\/\//, ""),
    },
  ].filter((ch) => ch.href); // hide channels that aren't set (or aren't valid links)

  document.getElementById("contact-channels").innerHTML = channels
    .map(
      (ch) => `
      <a href="${esc(ch.href)}" ${ch.key === "email" ? "" : 'target="_blank" rel="noopener noreferrer"'} class="group flex items-center gap-3 rounded-xl border border-slate-800 bg-void-900/60 px-4 py-3.5 text-left transition-colors hover:border-neon-cyan/50">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-void-800 text-neon-cyan">${CHANNEL_ICONS[ch.key]}</span>
        <span class="min-w-0">
          <span class="block font-mono text-[11px] text-slate-400">${ch.label}</span>
          <span class="block truncate text-sm text-slate-200">${esc(ch.value)}</span>
        </span>
      </a>`,
    )
    .join("");

  for (const key of ["github", "telegram", "linkedin"]) {
    const el = document.getElementById(`social-${key}`);
    const href = safeHref(contact[key]);
    if (href) el.href = href;
    else el.remove();
  }
}

// --- Contact form -----------------------------------------------------------
const contactForm = document.getElementById("contact-form");
const contactStatus = document.getElementById("contact-status");

function setStatus(text, ok) {
  contactStatus.textContent = text;
  contactStatus.className = `text-sm ${ok ? "text-neon-green" : "text-red-400"}`;
}

contactForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(contactForm));
  if (!data.name.trim() || !data.email.trim() || data.message.trim().length < 10) {
    setStatus("Please fill in your name, email, and a message (10+ characters).", false);
    return;
  }
  const button = contactForm.querySelector("button[type=submit]");
  button.disabled = true;
  setStatus("Sending…", true);
  try {
    const res = await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || "Could not send your message.");
    contactForm.reset();
    setStatus("Thanks — your message was sent. I'll get back to you soon.", true);
  } catch (err) {
    setStatus(err.message || "Could not send your message.", false);
  } finally {
    button.disabled = false;
  }
});

// --- Boot -------------------------------------------------------------------
async function loadContent() {
  // The server embeds the content in the page (see src/routes/page.js), so
  // normally there's no extra request. Fall back to the API if it isn't there.
  const embedded = document.getElementById("initial-content");
  if (embedded) {
    try {
      return JSON.parse(embedded.textContent);
    } catch {
      /* fall through to fetch */
    }
  }
  const res = await fetch("/api/content");
  if (!res.ok) throw new Error("Failed to load content");
  return res.json();
}

async function main() {
  try {
    const data = await loadContent();
    renderHero(data.hero || {});
    renderAbout(data.about || {}, data.hero || {});
    renderServices(data.services || []);
    renderProjects(data.projects || []);
    renderSkills(data.skills || []);
    renderContact(data.contact || {});
  } catch (err) {
    console.error(err);
    document.getElementById("hero-badge-text").textContent =
      "Content is temporarily unavailable — please refresh in a moment.";
  } finally {
    initReveal();
  }
}

main();
