import { Hono } from "hono";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { SkillDetail, SkillManifest, SkillSummary } from "@repo/types";
import type { Db } from "../db.js";
import { ConflictError, NotFoundError, Storage } from "../storage.js";

const NAME_RE = /^[a-z0-9][a-z0-9-]*$/;
const VERSION_RE = /^[a-zA-Z0-9][a-zA-Z0-9.\-+]*$/;
const MAX_TARBALL_BYTES = 5 * 1024 * 1024;

export function skillsRoutes(db: Db, storage: Storage): Hono {
  const app = new Hono();

  app.get("/", (c) => {
    const rows = db
      .prepare(
        "SELECT name, version, uploaded_at FROM skill_versions ORDER BY uploaded_at DESC",
      )
      .all() as Array<{ name: string; version: string; uploaded_at: string }>;
    const summaries: SkillSummary[] = rows.map((r) => ({
      name: r.name,
      version: r.version,
      uploadedAt: r.uploaded_at,
    }));
    return c.json(summaries);
  });

  app.post("/", async (c) => {
    const body = await c.req.parseBody();
    const file = body["skill"];
    if (!(file instanceof File)) {
      return c.json({ error: "missing 'skill' file field" }, 400);
    }
    if (file.size > MAX_TARBALL_BYTES) {
      return c.json({ error: "tarball exceeds 5MB limit" }, 413);
    }
    const buf = Buffer.from(await file.arrayBuffer());

    const stagingDir = await storage.extractToStaging(buf);
    try {
      const manifestRaw = await readFile(join(stagingDir, "skill.json"), "utf8").catch(
        () => null,
      );
      if (manifestRaw === null) {
        return c.json({ error: "skill.json not found at root of tarball" }, 400);
      }

      let manifest: SkillManifest;
      try {
        manifest = JSON.parse(manifestRaw);
      } catch {
        return c.json({ error: "skill.json is not valid JSON" }, 400);
      }
      if (typeof manifest.name !== "string" || !NAME_RE.test(manifest.name)) {
        return c.json({ error: "manifest.name must match /^[a-z0-9][a-z0-9-]*$/" }, 400);
      }
      if (typeof manifest.version !== "string" || !VERSION_RE.test(manifest.version)) {
        return c.json({ error: "manifest.version is missing or invalid" }, 400);
      }

      try {
        await storage.commit(stagingDir, manifest.name, manifest.version);
      } catch (e) {
        if (e instanceof ConflictError) return c.json({ error: e.message }, 409);
        throw e;
      }

      const uploadedAt = new Date().toISOString();
      try {
        db.prepare(
          "INSERT INTO skill_versions (name, version, uploaded_at, manifest) VALUES (?, ?, ?, ?)",
        ).run(manifest.name, manifest.version, uploadedAt, manifestRaw);
      } catch (e) {
        await storage.deleteVersion(manifest.name, manifest.version);
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("UNIQUE")) {
          return c.json({ error: `${manifest.name}@${manifest.version} already exists` }, 409);
        }
        throw e;
      }

      const summary: SkillSummary = {
        name: manifest.name,
        version: manifest.version,
        uploadedAt,
      };
      return c.json(summary, 201);
    } finally {
      await storage.cleanupStaging(stagingDir);
    }
  });

  app.get("/:name/:version", async (c) => {
    const { name, version } = c.req.param();
    const row = db
      .prepare(
        "SELECT name, version, uploaded_at, manifest FROM skill_versions WHERE name = ? AND version = ?",
      )
      .get(name, version) as
      | { name: string; version: string; uploaded_at: string; manifest: string }
      | undefined;
    if (!row) return c.json({ error: "not found" }, 404);

    let files: string[];
    try {
      files = await storage.listFiles(name, version);
    } catch (e) {
      if (e instanceof NotFoundError) return c.json({ error: "not found" }, 404);
      throw e;
    }

    const detail: SkillDetail = {
      name: row.name,
      version: row.version,
      uploadedAt: row.uploaded_at,
      manifest: JSON.parse(row.manifest) as SkillManifest,
      files,
    };
    return c.json(detail);
  });

  app.get("/:name/:version/files/*", async (c) => {
    const { name, version } = c.req.param();
    const marker = `/${version}/files/`;
    const idx = c.req.path.indexOf(marker);
    if (idx === -1) return c.json({ error: "bad request" }, 400);
    const relPath = decodeURIComponent(c.req.path.slice(idx + marker.length));
    if (!relPath) return c.json({ error: "missing path" }, 400);

    let content: string;
    try {
      content = await storage.readTextFile(name, version, relPath);
    } catch (e) {
      if (e instanceof NotFoundError) return c.json({ error: "not found" }, 404);
      throw e;
    }
    return c.body(content, 200, { "content-type": "text/plain; charset=utf-8" });
  });

  return app;
}
