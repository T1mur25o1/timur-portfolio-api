import { iconSvg, colorSet } from "./icons.js";

const TOKEN_KEY = "admin_token";

const loginScreen = document.getElementById("login-screen");
const dashboard = document.getElementById("dashboard");
const toastEl = document.getElementById("toast");

let currentData = null;

// --- Helpers ---------------------------------------------------------------

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}
function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

function showToast(message, type = "success") {
  toastEl.textContent = message;
  toastEl.className = `toast ${type} show`;
  setTimeout(() => toastEl.classList.remove("show"), 2600);
}

async function api(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(path, { ...options, headers });
  if (res.status === 401) {
    clearToken();
    showLogin();
    throw new Error("Session expired — please sign in again");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

function esc(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

// --- Auth / screen switching -------------------------------------------

function showLogin() {
  loginScreen.classList.remove("hidden");
  dashboard.classList.add("hidden");
}

function showDashboard() {
  loginScreen.classList.add("hidden");
  dashboard.classList.remove("hidden");
  loadAll();
}

document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const password = document.getElementById("login-password").value;
  const errorEl = document.getElementById("login-error");
  errorEl.classList.add("hidden");
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || "Login failed");
    setToken(body.token);
    showDashboard();
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove("hidden");
  }
});

document.getElementById("logout-btn").addEventListener("click", () => {
  clearToken();
  showLogin();
});

async function checkAuth() {
  if (!getToken()) return showLogin();
  try {
    await api("/api/auth/me");
    showDashboard();
  } catch {
    showLogin();
  }
}

// --- Tabs --------------------------------------------------------------

document.getElementById("tabs").addEventListener("click", (e) => {
  const btn = e.target.closest(".tab-btn");
  if (!btn) return;
  document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  const tab = btn.dataset.tab;
  document.querySelectorAll(".tab-panel").forEach((p) => {
    p.classList.toggle("hidden", p.dataset.panel !== tab);
  });
});

// --- Load everything -----------------------------------------------------

async function loadAll() {
  try {
    currentData = await api("/api/content");
    fillHeroForm(currentData.hero);
    fillAboutForm(currentData.about);
    fillSkills(currentData.skills);
    fillContactForm(currentData.contact);
    renderServicesList(currentData.services);
    renderProjectsList(currentData.projects);
  } catch (err) {
    showToast(err.message, "error");
  }
}

// --- Hero ----------------------------------------------------------------

function fillHeroForm(hero) {
  const form = document.getElementById("hero-form");
  form.badge.value = hero.badge || "";
  form.name.value = hero.name || "";
  form.roles.value = (hero.roles || []).join("\n");
  form.description.value = hero.description || "";
}

document.getElementById("hero-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  try {
    await api("/api/content/hero", {
      method: "PUT",
      body: JSON.stringify({
        badge: form.badge.value,
        name: form.name.value,
        roles: form.roles.value.split("\n").map((r) => r.trim()).filter(Boolean),
        description: form.description.value,
      }),
    });
    showToast("Hero section saved");
  } catch (err) {
    showToast(err.message, "error");
  }
});

// --- About -----------------------------------------------------------------

function fillAboutForm(about) {
  const form = document.getElementById("about-form");
  form.eyebrow.value = about.eyebrow || "";
  form.heading.value = about.heading || "";
  form.paragraph.value = about.paragraph || "";

  const statsWrap = document.getElementById("stats-fields");
  const stats = about.stats && about.stats.length ? about.stats : [{}, {}, {}, {}];
  statsWrap.innerHTML = stats
    .map(
      (s, i) => `
      <div class="space-y-2">
        <input class="field-input" data-stat="${i}" data-field="label" placeholder="Label" value="${esc(s.label || "")}" />
        <input class="field-input" data-stat="${i}" data-field="value" placeholder="Value" value="${esc(s.value || "")}" />
      </div>`
    )
    .join("");
}

document.getElementById("about-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  const stats = [];
  document.querySelectorAll('#stats-fields [data-stat]').forEach((input) => {
    const idx = Number(input.dataset.stat);
    stats[idx] = stats[idx] || {};
    stats[idx][input.dataset.field] = input.value;
  });
  try {
    await api("/api/content/about", {
      method: "PUT",
      body: JSON.stringify({
        eyebrow: form.eyebrow.value,
        heading: form.heading.value,
        paragraph: form.paragraph.value,
        stats,
      }),
    });
    showToast("About section saved");
  } catch (err) {
    showToast(err.message, "error");
  }
});

// --- Skills ----------------------------------------------------------------

let skillsDraft = [];

function fillSkills(skills) {
  skillsDraft = [...(skills || [])];
  renderSkillsChips();
}

function renderSkillsChips() {
  document.getElementById("skills-chips").innerHTML = skillsDraft
    .map(
      (s, i) => `<span class="chip">${esc(s)} <button type="button" data-remove="${i}">&times;</button></span>`
    )
    .join("");
}

document.getElementById("skills-chips").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-remove]");
  if (!btn) return;
  skillsDraft.splice(Number(btn.dataset.remove), 1);
  renderSkillsChips();
});

function addSkillFromInput() {
  const input = document.getElementById("skill-input");
  const value = input.value.trim();
  if (value) {
    skillsDraft.push(value);
    renderSkillsChips();
  }
  input.value = "";
}

document.getElementById("add-skill-btn").addEventListener("click", addSkillFromInput);
document.getElementById("skill-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addSkillFromInput();
  }
});

document.getElementById("skills-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    await api("/api/content/skills", {
      method: "PUT",
      body: JSON.stringify({ skills: skillsDraft }),
    });
    showToast("Skills saved");
  } catch (err) {
    showToast(err.message, "error");
  }
});

// --- Contact ----------------------------------------------------------------

function fillContactForm(contact) {
  const form = document.getElementById("contact-form");
  form.email.value = contact.email || "";
  form.telegram.value = contact.telegram || "";
  form.github.value = contact.github || "";
  form.linkedin.value = contact.linkedin || "";
}

document.getElementById("contact-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const form = e.target;
  try {
    await api("/api/content/contact", {
      method: "PUT",
      body: JSON.stringify({
        email: form.email.value,
        telegram: form.telegram.value,
        github: form.github.value,
        linkedin: form.linkedin.value,
      }),
    });
    showToast("Contact info saved");
  } catch (err) {
    showToast(err.message, "error");
  }
});

// --- Generic collection manager (services / projects) ----------------------

function makeCollectionManager({ endpoint, listId, formId, formTitleId, newBtnId, cancelBtnId, extraFields, cardRenderer }) {
  const listEl = document.getElementById(listId);
  const formEl = document.getElementById(formId);
  const formTitleEl = document.getElementById(formTitleId);

  function openForm(item) {
    formEl.classList.remove("hidden");
    formEl.reset();
    formEl.itemId.value = item ? item.id : "";
    formTitleEl.textContent = item ? `Edit: ${item.title}` : "Add new";
    if (item) {
      formEl.title.value = item.title || "";
      formEl.description.value = item.description || "";
      formEl.icon.value = item.icon || "code";
      formEl.color.value = item.color || "cyan";
      formEl.tags.value = (item.tags || []).join(", ");
      extraFields.forEach((field) => {
        if (formEl[field]) formEl[field].value = item[field] || "";
      });
    }
    formEl.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function closeForm() {
    formEl.classList.add("hidden");
    formEl.reset();
  }

  document.getElementById(newBtnId).addEventListener("click", () => openForm(null));
  document.getElementById(cancelBtnId).addEventListener("click", closeForm);

  listEl.addEventListener("click", async (e) => {
    const editBtn = e.target.closest("[data-edit]");
    const delBtn = e.target.closest("[data-delete]");
    if (editBtn) {
      const item = currentData[endpoint.split("/").pop()].find((x) => x.id === editBtn.dataset.edit);
      openForm(item);
    }
    if (delBtn) {
      if (!confirm("Delete this item? This can't be undone.")) return;
      try {
        await api(`${endpoint}/${delBtn.dataset.delete}`, { method: "DELETE" });
        showToast("Deleted");
        await loadAll();
      } catch (err) {
        showToast(err.message, "error");
      }
    }
  });

  formEl.addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = formEl.itemId.value;
    const payload = {
      title: formEl.title.value,
      description: formEl.description.value,
      icon: formEl.icon.value,
      color: formEl.color.value,
      tags: formEl.tags.value.split(",").map((t) => t.trim()).filter(Boolean),
    };
    extraFields.forEach((field) => {
      if (formEl[field]) payload[field] = formEl[field].value;
    });

    try {
      if (id) {
        await api(`${endpoint}/${id}`, { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await api(endpoint, { method: "POST", body: JSON.stringify(payload) });
      }
      showToast("Saved");
      closeForm();
      await loadAll();
    } catch (err) {
      showToast(err.message, "error");
    }
  });

  return function render(items) {
    listEl.innerHTML = (items || [])
      .map((item) => cardRenderer(item))
      .join("");
  };
}

function collectionCard(item, extraLabel) {
  const c = colorSet(item.color);
  return `
    <div class="glass rounded-xl p-4 flex items-center gap-4">
      <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-void-900 ${c.text}">${iconSvg(item.icon)}</span>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold text-white truncate">${esc(item.title)}</span>
          ${extraLabel ? `<span class="font-mono text-[11px] ${c.text}">${esc(extraLabel(item))}</span>` : ""}
        </div>
        <p class="text-xs text-slate-500 truncate">${esc(item.description)}</p>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <button type="button" class="btn-secondary !py-1.5 !px-3 text-xs" data-edit="${item.id}">Edit</button>
        <button type="button" class="btn-danger" data-delete="${item.id}">Delete</button>
      </div>
    </div>`;
}

const renderServicesList = makeCollectionManager({
  endpoint: "/api/services",
  listId: "services-list",
  formId: "service-form",
  formTitleId: "service-form-title",
  newBtnId: "new-service-btn",
  cancelBtnId: "cancel-service-btn",
  extraFields: ["subtitle"],
  cardRenderer: (item) => collectionCard(item, (i) => i.subtitle),
});

const renderProjectsList = makeCollectionManager({
  endpoint: "/api/projects",
  listId: "projects-list",
  formId: "project-form",
  formTitleId: "project-form-title",
  newBtnId: "new-project-btn",
  cancelBtnId: "cancel-project-btn",
  extraFields: ["category"],
  cardRenderer: (item) => collectionCard(item, (i) => i.category),
});

checkAuth();
