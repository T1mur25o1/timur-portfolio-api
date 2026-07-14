import { startMatrixRain } from "./matrix.js";
import { iconSvg, colorSet } from "./icons.js";

const STAT_ICONS = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v2m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="16" r="1"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>',
];

function esc(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// --- Navbar scroll state + mobile menu -------------------------------
const navbar = document.getElementById("navbar");
window.addEventListener("scroll", () => {
  if (window.scrollY > 24) {
    navbar.classList.add("glass", "shadow-glow", "py-3");
    navbar.classList.remove("py-5");
  } else {
    navbar.classList.remove("glass", "shadow-glow", "py-3");
    navbar.classList.add("py-5");
  }
});

const menuBtn = document.getElementById("menu-btn");
const mobileMenu = document.getElementById("mobile-menu");
menuBtn.addEventListener("click", () => mobileMenu.classList.toggle("hidden"));
mobileMenu.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => mobileMenu.classList.add("hidden"))
);

// --- Footer year --------------------------------------------------------
document.getElementById("footer-year").textContent =
  "© " + new Date().getFullYear() + " Timur — Full-Stack Dev · Security Analyst · Bot Maker · EA Developer";

// --- Matrix rain ----------------------------------------------------------
startMatrixRain(document.getElementById("matrix-canvas"));

// --- Scroll reveal --------------------------------------------------------
function initReveal() {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
}

// --- Typewriter -------------------------------------------------------
function startTypewriter(roles) {
  const el = document.getElementById("typewriter");
  let roleIndex = 0, charIndex = 0, deleting = false;
  function tick() {
    const current = roles[roleIndex % roles.length] || "";
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

// --- Render sections from API data ----------------------------------------
function renderHero(hero) {
  document.getElementById("hero-badge-text").textContent = hero.badge || "";
  document.getElementById("hero-name").textContent = hero.name || "Timur";
  document.getElementById("hero-description").textContent = hero.description || "";
  startTypewriter(hero.roles || []);
}

function renderAbout(about) {
  document.getElementById("about-eyebrow").textContent = about.eyebrow || "Whoami";
  document.getElementById("about-heading").textContent = about.heading || "";
  document.getElementById("about-paragraph").textContent = about.paragraph || "";

  const stats = about.stats || [];
  document.getElementById("about-stats").innerHTML = stats
    .map(
      (stat, i) => `
      <div class="glass glow-card rounded-2xl p-4 transition-transform hover:-translate-y-1">
        <span class="h-5 w-5 text-neon-violet inline-block">${STAT_ICONS[i % STAT_ICONS.length]}</span>
        <div class="mt-2 font-display text-lg font-semibold text-white">${esc(stat.value)}</div>
        <div class="font-mono text-xs text-slate-500">${esc(stat.label)}</div>
      </div>`
    )
    .join("");

  document.getElementById("about-json").textContent = JSON.stringify(
    {
      name: document.getElementById("hero-name").textContent,
      major: "Cyber Security",
      university: "New Uzbekistan University",
      status: "available",
    },
    null,
    2
  );
}

function serviceCard(item) {
  const c = colorSet(item.color);
  return `
    <div class="reveal in-view group glow-card relative overflow-hidden rounded-2xl border border-slate-800 bg-void-800/60 p-7 transition-colors ${c.border}">
      <div class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br ${c.grad} blur-2xl transition-transform duration-500 group-hover:scale-125"></div>
      <div class="relative">
        <div class="flex items-center justify-between">
          <span class="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-700 bg-void-900 ${c.text}">${iconSvg(item.icon)}</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-slate-600 transition-all group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17 17 7M7 7h10v10"/></svg>
        </div>
        <h3 class="mt-5 font-display text-xl font-semibold text-white">${esc(item.title)}</h3>
        <p class="mt-1 font-mono text-xs ${c.text}">${esc(item.subtitle)}</p>
        <p class="mt-4 text-sm leading-relaxed text-slate-400">${esc(item.description)}</p>
        <div class="mt-5 flex flex-wrap gap-2">
          ${(item.tags || []).map((t) => `<span class="rounded-full border border-slate-700 px-3 py-1 font-mono text-[11px] text-slate-400">${esc(t)}</span>`).join("")}
        </div>
      </div>
    </div>`;
}

function projectCard(item) {
  const c = colorSet(item.color);
  return `
    <div class="reveal in-view group relative overflow-hidden rounded-2xl border border-slate-800 bg-void-800/50 transition-all hover:-translate-y-1 ${c.border}">
      <div class="flex h-40 items-center justify-center border-b border-slate-800 bg-gradient-to-br from-void-900 to-void-800">
        <span class="h-12 w-12 ${c.text} opacity-80 transition-transform duration-500 group-hover:scale-110 inline-block">${iconSvg(item.icon)}</span>
      </div>
      <div class="p-6">
        <div class="flex items-center justify-between">
          <span class="font-mono text-xs ${c.text}">${esc(item.category)}</span>
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 17 17 7M7 7h10v10"/></svg>
        </div>
        <h3 class="mt-2 font-display text-lg font-semibold text-white">${esc(item.title)}</h3>
        <p class="mt-2 text-sm text-slate-400">${esc(item.description)}</p>
        <div class="mt-4 flex flex-wrap gap-2">
          ${(item.tags || []).map((t) => `<span class="rounded-full border border-slate-700 px-3 py-1 font-mono text-[11px] text-slate-400">${esc(t)}</span>`).join("")}
        </div>
      </div>
    </div>`;
}

function renderServices(services) {
  document.getElementById("services-grid").innerHTML = (services || []).map(serviceCard).join("");
}

function renderProjects(projects) {
  document.getElementById("projects-grid").innerHTML = (projects || []).map(projectCard).join("");
}

function renderSkills(skills) {
  const loop = [...(skills || []), ...(skills || [])];
  document.getElementById("skills-track").innerHTML = loop
    .map(
      (s) =>
        `<span class="glass whitespace-nowrap rounded-full border border-slate-800 px-5 py-2.5 font-mono text-sm text-slate-300"><span class="mr-2 text-neon-cyan">&#9657;</span>${esc(s)}</span>`
    )
    .join("");
}

function renderContact(contact) {
  const channels = [
    { key: "email", label: "Email", href: `mailto:${contact.email}`, value: contact.email },
    { key: "telegram", label: "Telegram", href: contact.telegram, value: (contact.telegram || "").replace(/^https?:\/\/t\.me\//, "@") },
    { key: "github", label: "GitHub", href: contact.github, value: (contact.github || "").replace(/^https?:\/\//, "") },
    { key: "linkedin", label: "LinkedIn", href: contact.linkedin, value: (contact.linkedin || "").replace(/^https?:\/\//, "") },
  ];
  const icons = {
    email: '<svg xmlns="http://www.w3.org/2000/svg" class="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 6 10-6"/></svg>',
    telegram: '<svg xmlns="http://www.w3.org/2000/svg" class="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor"><path d="M21.94 4.6 3.6 11.86c-1.24.5-1.23 1.19-.22 1.5l4.7 1.47 1.8 5.5c.22.6.4.85.82.85.4 0 .58-.18.8-.4l1.94-1.87 4.03 2.97c.74.41 1.28.2 1.47-.68l2.66-12.5c.28-1.1-.42-1.6-1.06-1.2Z"/></svg>',
    github: '<svg xmlns="http://www.w3.org/2000/svg" class="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.73.5.98 5.24.98 11.52c0 4.94 3.2 9.13 7.65 10.6.56.1.76-.24.76-.54 0-.27-.01-1.15-.02-2.09-3.11.68-3.77-1.34-3.77-1.34-.5-1.29-1.24-1.63-1.24-1.63-1.01-.7.08-.68.08-.68 1.12.08 1.71 1.16 1.71 1.16.99 1.71 2.6 1.21 3.24.93.1-.72.39-1.21.71-1.49-2.49-.28-5.1-1.24-5.1-5.55 0-1.23.44-2.23 1.16-3.02-.12-.28-.5-1.42.11-2.96 0 0 .95-.3 3.1 1.16.9-.25 1.87-.37 2.83-.38.96 0 1.93.13 2.83.38 2.15-1.46 3.1-1.16 3.1-1.16.61 1.54.23 2.68.11 2.96.72.79 1.16 1.79 1.16 3.02 0 4.32-2.62 5.27-5.11 5.55.4.35.76 1.03.76 2.08 0 1.5-.01 2.71-.01 3.08 0 .3.2.65.77.54 4.44-1.48 7.64-5.66 7.64-10.6C23.02 5.24 18.27.5 12 .5Z"/></svg>',
    linkedin: '<svg xmlns="http://www.w3.org/2000/svg" class="h-4.5 w-4.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.45v6.29ZM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12ZM7.12 20.45H3.56V9h3.56v11.45Z"/></svg>',
  };

  document.getElementById("contact-channels").innerHTML = channels
    .map(
      (ch) => `
      <a href="${esc(ch.href)}" target="_blank" rel="noreferrer" class="group flex items-center gap-3 rounded-xl border border-slate-800 bg-void-900/60 px-4 py-3.5 text-left transition-colors hover:border-neon-cyan/50">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-void-800 text-neon-cyan">${icons[ch.key]}</span>
        <span class="min-w-0">
          <span class="block font-mono text-[11px] text-slate-500">${ch.label}</span>
          <span class="block truncate text-sm text-slate-200">${esc(ch.value)}</span>
        </span>
      </a>`
    )
    .join("");

  document.getElementById("contact-cta").href = `mailto:${contact.email}`;
  document.getElementById("social-github").href = contact.github || "#";
  document.getElementById("social-telegram").href = contact.telegram || "#";
  document.getElementById("social-linkedin").href = contact.linkedin || "#";
}

async function main() {
  try {
    const res = await fetch("/api/content");
    if (!res.ok) throw new Error("Failed to load content");
    const data = await res.json();

    renderHero(data.hero || {});
    renderAbout(data.about || {});
    renderServices(data.services || []);
    renderProjects(data.projects || []);
    renderSkills(data.skills || []);
    renderContact(data.contact || {});
  } catch (err) {
    console.error(err);
    document.getElementById("hero-badge-text").textContent = "Could not load content from the API";
  } finally {
    initReveal();
  }
}

main();
