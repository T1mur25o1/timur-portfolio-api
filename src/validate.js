/**
 * Small, dependency-free input validation for admin and contact-form writes.
 *
 * Each schema maps a field name to a rule. `sanitize(body, schema)` returns
 * only the known fields (unknown fields are dropped) and throws an HttpError
 * with status 400 on the first invalid value.
 */

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.expose = true; // safe to show to the client
  }
}

const bad = (msg) => new HttpError(400, msg);

/** Only these URL schemes may be stored — blocks javascript:, data:, etc. */
export function isSafeUrl(value, { allowMailto = false } = {}) {
  try {
    const u = new URL(value);
    return (
      u.protocol === "https:" || u.protocol === "http:" || (allowMailto && u.protocol === "mailto:")
    );
  } catch {
    return false;
  }
}

export const rules = {
  string:
    (max = 500) =>
    (v, name) => {
      if (typeof v !== "string") throw bad(`${name} must be a string`);
      const t = v.trim();
      if (t.length > max) throw bad(`${name} must be at most ${max} characters`);
      return t;
    },
  stringArray:
    (maxItems = 30, maxLen = 80) =>
    (v, name) => {
      if (!Array.isArray(v)) throw bad(`${name} must be an array of strings`);
      if (v.length > maxItems) throw bad(`${name} may have at most ${maxItems} items`);
      return v
        .filter((s) => typeof s === "string")
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .map((s) => {
          if (s.length > maxLen)
            throw bad(`each item in ${name} must be at most ${maxLen} characters`);
          return s;
        });
    },
  /** Empty string allowed (means "not set"); otherwise must be http(s). */
  url: () => (v, name) => {
    if (typeof v !== "string") throw bad(`${name} must be a string`);
    const t = v.trim();
    if (t === "") return "";
    if (t.length > 500 || !isSafeUrl(t)) throw bad(`${name} must be an http(s) URL`);
    return t;
  },
  email: () => (v, name) => {
    if (typeof v !== "string") throw bad(`${name} must be a string`);
    const t = v.trim();
    if (t === "") return "";
    if (t.length > 200 || !/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(t))
      throw bad(`${name} must be a valid email address`);
    return t;
  },
  oneOf: (allowed) => (v, name) => {
    if (!allowed.includes(v)) throw bad(`${name} must be one of: ${allowed.join(", ")}`);
    return v;
  },
  stats: () => (v, name) => {
    if (!Array.isArray(v) || v.length > 8) throw bad(`${name} must be an array of at most 8 items`);
    return v.map((s) => ({
      label: rules.string(40)(s?.label ?? "", `${name}.label`),
      value: rules.string(40)(s?.value ?? "", `${name}.value`),
    }));
  },
};

/**
 * @param {object} body     request body
 * @param {object} schema   { field: rule }
 * @param {object} opts     { required: [fields] }
 */
export function sanitize(body, schema, { required = [] } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body))
    throw bad("Request body must be a JSON object");
  const out = {};
  for (const [field, rule] of Object.entries(schema)) {
    if (body[field] === undefined) continue;
    out[field] = rule(body[field], field);
  }
  for (const field of required) {
    if (out[field] === undefined || out[field] === "") throw bad(`${field} is required`);
  }
  return out;
}

const ICONS = ["code", "shield", "bot", "chart", "globe"];
const COLORS = ["cyan", "green", "violet", "fuchsia"];

export const schemas = {
  hero: {
    badge: rules.string(120),
    name: rules.string(60),
    roles: rules.stringArray(10, 60),
    description: rules.string(600),
  },
  about: {
    eyebrow: rules.string(40),
    heading: rules.string(160),
    paragraph: rules.string(2000),
    stats: rules.stats(),
    major: rules.string(60),
    university: rules.string(80),
    status: rules.string(40),
  },
  contact: {
    email: rules.email(),
    telegram: rules.url(),
    github: rules.url(),
    linkedin: rules.url(),
  },
  service: {
    title: rules.string(80),
    subtitle: rules.string(80),
    description: rules.string(600),
    tags: rules.stringArray(12, 40),
    icon: rules.oneOf(ICONS),
    color: rules.oneOf(COLORS),
  },
  project: {
    title: rules.string(80),
    category: rules.string(40),
    description: rules.string(600),
    tags: rules.stringArray(12, 40),
    icon: rules.oneOf(ICONS),
    color: rules.oneOf(COLORS),
    repoUrl: rules.url(),
    demoUrl: rules.url(),
  },
  message: {
    name: rules.string(100),
    email: rules.email(),
    message: rules.string(4000),
  },
};
