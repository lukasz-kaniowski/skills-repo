import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp, type AppHandle } from "../src/app.js";

describe("api GET /", () => {
  let dataDir: string;
  let handle: AppHandle;

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), "skills-api-test-"));
    handle = createApp({ dataDir });
  });

  afterEach(async () => {
    handle.db.close();
    await rm(dataDir, { recursive: true, force: true });
  });

  it("returns a Greeting JSON payload", async () => {
    const res = await handle.app.request("/");
    expect(res.status).toBe(200);

    const body = (await res.json()) as { message: string; at: string };

    expect(body.message).toBe("hello from api");
    expect(typeof body.at).toBe("string");
    expect(Number.isNaN(Date.parse(body.at))).toBe(false);
  });
});

describe("api GET /doc", () => {
  let dataDir: string;
  let handle: AppHandle;

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), "skills-api-test-"));
    handle = createApp({ dataDir });
  });

  afterEach(async () => {
    handle.db.close();
    await rm(dataDir, { recursive: true, force: true });
  });

  it("returns a valid OpenAPI 3.0 document", async () => {
    const res = await handle.app.request("/doc");
    expect(res.status).toBe(200);

    const doc = (await res.json()) as Record<string, unknown>;

    expect(doc.openapi).toBe("3.0.0");
    expect(doc.info).toMatchObject({
      title: "Skills API",
      version: "0.0.1",
    });
    expect(doc.paths).toBeDefined();
    const paths = doc.paths as Record<string, unknown>;
    expect(paths["/"]).toBeDefined();
    expect(paths["/skills"]).toBeDefined();
    expect(paths["/skills/{name}/{version}"]).toBeDefined();
  });
});
