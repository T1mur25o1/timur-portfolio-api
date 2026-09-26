import { jest } from "@jest/globals";
import request from "supertest";
import app from "../src/index.js";
import { initDb } from "../src/db.js";
import { contentStore } from "../src/store.js";
import { resetMemoryStore } from "../src/memoryStore.js";
import { loginLimiter } from "../src/routes/auth.js";
import { messageLimiter } from "../src/routes/messages.js";

let token;

async function login() {
  const res = await request(app)
    .post("/api/auth/login")
    .send({ password: process.env.ADMIN_PASSWORD });
  return res.body.token;
}

beforeEach(async () => {
  resetMemoryStore();
  loginLimiter.reset();
  messageLimiter.reset();
  await initDb();
  token = await login();
});

const auth = () => ({ Authorization: `Bearer ${token}` });

describe("auth", () => {
  it("rejects a wrong password and accepts the right one", async () => {
    const bad = await request(app).post("/api/auth/login").send({ password: "nope" });
    expect(bad.status).toBe(401);
    expect(token).toEqual(expect.any(String));
    const me = await request(app).get("/api/auth/me").set(auth());
    expect(me.status).toBe(200);
  });

  it("rate-limits repeated login attempts", async () => {
    loginLimiter.reset();
    const statuses = [];
    for (let i = 0; i < 12; i++) {
      statuses.push(
        (
          await request(app)
            .post("/api/auth/login")
            .send({ password: `guess${i}` })
        ).status,
      );
    }
    expect(statuses.slice(0, 10).every((s) => s === 401)).toBe(true);
    expect(statuses.slice(10)).toEqual([429, 429]);
  });

  it("rejects unsigned (alg:none) tokens", async () => {
    const forged = "eyJhbGciOiJub25lIn0.eyJyb2xlIjoiYWRtaW4ifQ.";
    const res = await request(app)
      .get("/api/auth/me")
      .set({ Authorization: `Bearer ${forged}` });
    expect(res.status).toBe(401);
  });

  it("does not crash when JWT_SECRET is missing", async () => {
    loginLimiter.reset();
    const saved = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;
    const res = await request(app)
      .post("/api/auth/login")
      .send({ password: process.env.ADMIN_PASSWORD });
    process.env.JWT_SECRET = saved;
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/not configured/);
  });
});

describe("content", () => {
  it("serves seeded content publicly", async () => {
    const res = await request(app).get("/api/content");
    expect(res.status).toBe(200);
    expect(res.body.hero.name).toBe("Timur");
    expect(res.body.projects).toHaveLength(4);
  });

  it("requires a token to edit", async () => {
    const res = await request(app).put("/api/content/hero").send({ name: "x" });
    expect(res.status).toBe(401);
  });

  it("rejects javascript: URLs in contact links", async () => {
    const res = await request(app)
      .put("/api/content/contact")
      .set(auth())
      .send({ github: "javascript:alert(document.domain)" });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/http\(s\) URL/);
  });

  it("allows clearing a contact link", async () => {
    const res = await request(app).put("/api/content/contact").set(auth()).send({ telegram: "" });
    expect(res.status).toBe(200);
    expect(res.body.telegram).toBe("");
  });

  it("rejects wrong types and drops unknown fields", async () => {
    const wrongType = await request(app)
      .put("/api/content/hero")
      .set(auth())
      .send({ roles: "oops" });
    expect(wrongType.status).toBe(400);

    const extra = await request(app)
      .put("/api/content/hero")
      .set(auth())
      .send({ name: "Timur J.", isAdmin: true });
    expect(extra.status).toBe(200);
    expect(extra.body.name).toBe("Timur J.");
    expect(extra.body).not.toHaveProperty("isAdmin");
  });

  it("saves the editable about-card fields", async () => {
    const res = await request(app)
      .put("/api/content/about")
      .set(auth())
      .send({ status: "open to internships" });
    expect(res.body.status).toBe("open to internships");
    expect(res.body.university).toBe("New Uzbekistan University");
  });
});

describe("projects CRUD", () => {
  it("creates, updates and deletes a project with links", async () => {
    const created = await request(app).post("/api/projects").set(auth()).send({
      title: "MT5 MCP server",
      category: "Tooling",
      icon: "code",
      color: "cyan",
      repoUrl: "https://github.com/example/mt5-mcp",
      id: "attacker-chosen",
    });
    expect(created.status).toBe(201);
    expect(created.body.id).not.toBe("attacker-chosen");
    expect(created.body.repoUrl).toBe("https://github.com/example/mt5-mcp");

    const id = created.body.id;
    const updated = await request(app)
      .put(`/api/projects/${id}`)
      .set(auth())
      .send({ demoUrl: "https://demo.example.com" });
    expect(updated.status).toBe(200);
    expect(updated.body.title).toBe("MT5 MCP server");

    expect((await request(app).delete(`/api/projects/${id}`).set(auth())).status).toBe(204);
    expect((await request(app).delete(`/api/projects/${id}`).set(auth())).status).toBe(404);
  });

  it("requires a title and a known icon", async () => {
    expect((await request(app).post("/api/projects").set(auth()).send({})).status).toBe(400);
    expect(
      (await request(app).post("/api/projects").set(auth()).send({ title: "x", icon: "<svg>" }))
        .status,
    ).toBe(400);
  });
});

describe("contact messages", () => {
  const valid = {
    name: "Ali",
    email: "ali@example.com",
    message: "I need a Telegram bot for my shop.",
  };

  it("stores a valid message and shows it in the admin inbox", async () => {
    const res = await request(app).post("/api/messages").send(valid);
    expect(res.status).toBe(201);

    expect((await request(app).get("/api/messages")).status).toBe(401);
    const inbox = await request(app).get("/api/messages").set(auth());
    expect(inbox.body).toHaveLength(1);
    expect(inbox.body[0]).toMatchObject({ name: "Ali", read: false });

    const id = inbox.body[0].id;
    expect(
      (await request(app).put(`/api/messages/${id}`).set(auth()).send({ read: true })).status,
    ).toBe(200);
    expect((await request(app).delete(`/api/messages/${id}`).set(auth())).status).toBe(204);
  });

  it("silently drops honeypot submissions", async () => {
    const res = await request(app)
      .post("/api/messages")
      .send({ ...valid, website: "http://spam" });
    expect(res.status).toBe(201);
    const inbox = await request(app).get("/api/messages").set(auth());
    expect(inbox.body).toHaveLength(0);
  });

  it("validates input", async () => {
    expect(
      (
        await request(app)
          .post("/api/messages")
          .send({ ...valid, email: "not-an-email" })
      ).status,
    ).toBe(400);
    expect(
      (
        await request(app)
          .post("/api/messages")
          .send({ ...valid, message: "hi" })
      ).status,
    ).toBe(400);
  });

  it("rate-limits floods", async () => {
    const statuses = [];
    for (let i = 0; i < 7; i++)
      statuses.push((await request(app).post("/api/messages").send(valid)).status);
    expect(statuses).toEqual([201, 201, 201, 201, 201, 429, 429]);
  });
});

describe("resilience", () => {
  it("returns a generic 500 instead of crashing when the database fails", async () => {
    const spy = jest
      .spyOn(contentStore, "read")
      .mockRejectedValueOnce(new Error("secret-db-host.mongodb.net unreachable"));
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const res = await request(app).get("/api/content");
    expect(res.status).toBe(500);
    expect(res.body.error).toBe("Internal Server Error");
    expect(JSON.stringify(res.body)).not.toMatch(/mongodb/);
    spy.mockRestore();
    errSpy.mockRestore();

    // …and the app keeps serving afterwards.
    expect((await request(app).get("/api/content")).status).toBe(200);
  });

  it("still serves the page (without embedded content) when the database fails", async () => {
    const spy = jest.spyOn(contentStore, "read").mockRejectedValueOnce(new Error("down"));
    const errSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.text).not.toContain("initial-content");
    spy.mockRestore();
    errSpy.mockRestore();
  });
});

describe("public page", () => {
  it("embeds content safely and fills Open Graph tags", async () => {
    await request(app)
      .put("/api/content/hero")
      .set(auth())
      .send({ description: 'Break </script><script>alert(1)</script> & "quotes"' });
    const res = await request(app).get("/");
    expect(res.status).toBe(200);
    expect(res.text).toContain('<script id="initial-content" type="application/json">');
    // The only </script> sequences are real tag ends, not injected ones.
    expect(res.text).not.toContain("</script><script>alert(1)");
    expect(res.text).toMatch(/<meta property="og:description" content="Break &lt;\/script&gt;/);
    expect(res.text).toMatch(/og:image" content="http:\/\/127\.0\.0\.1:\d+\/og-image\.png"/);
    expect(res.text).not.toContain("__SITE_ORIGIN__");
  });

  it("sets security headers", async () => {
    const res = await request(app).get("/");
    expect(res.headers["content-security-policy"]).toContain("script-src 'self'");
    expect(res.headers["x-frame-options"]).toBe("DENY");
    expect(res.headers["x-powered-by"]).toBeUndefined();
  });
});
