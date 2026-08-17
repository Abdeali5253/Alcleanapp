import request from "supertest";
import { describe, expect, it } from "vitest";
import { createNotificationAdminApp } from "./notification-admin-server.js";

const port = 3011;
const password = "test-password-with-20-characters";
const authorization = `Basic ${Buffer.from(`admin:${password}`).toString("base64")}`;
const host = `localhost:${port}`;

describe("notification admin GUI security", () => {
  const app = createNotificationAdminApp(password, port);

  it("requires administrator authentication", async () => {
    const response = await request(app).get("/").set("Host", host);
    expect(response.status).toBe(401);
    expect(response.headers["www-authenticate"]).toContain("Basic");
  });

  it("rejects non-local host headers", async () => {
    const response = await request(app)
      .get("/")
      .set("Host", "api.alclean.pk")
      .set("Authorization", authorization);
    expect(response.status).toBe(403);
  });

  it("serves the authenticated console with defensive headers", async () => {
    const response = await request(app)
      .get("/")
      .set("Host", host)
      .set("Authorization", authorization);
    expect(response.status).toBe(200);
    expect(response.headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  });

  it("rejects cross-origin notification sends", async () => {
    const response = await request(app)
      .post("/api/send")
      .set("Host", host)
      .set("Authorization", authorization)
      .set("Origin", "https://attacker.example")
      .set("X-AlClean-Admin", "1")
      .send({ title: "Test", body: "Test" });
    expect(response.status).toBe(403);
  });

  it("validates notification content before sending", async () => {
    const response = await request(app)
      .post("/api/send")
      .set("Host", host)
      .set("Authorization", authorization)
      .set("Origin", `http://${host}`)
      .set("X-AlClean-Admin", "1")
      .send({ title: "", body: "" });
    expect(response.status).toBe(400);
  });
});
