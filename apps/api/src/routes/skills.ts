import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { SkillDetail, SkillManifest, SkillSummary } from "@repo/types";
import type { Db } from "../db.js";
import { ConflictError, NotFoundError, Storage } from "../storage.js";

const NAME_RE = /^[a-z0-9][a-z0-9-]*$/;
const VERSION_RE = /^[a-zA-Z0-9][a-zA-Z0-9.\-+]*$/;
const MAX_TARBALL_BYTES = 5 * 1024 * 1024;

const ErrorSchema = z
  .object({ error: z.string() })
  .openapi("Error");

const SkillSummarySchema = z
  .object({
    name: z.string(),
    version: z.string(),
    uploadedAt: z.string().datetime(),
  })
  .openapi("SkillSummary");

const SkillManifestSchema = z
  .object({
    name: z.string(),
    version: z.string(),
    description: z.string().optional(),
  })
  .openapi("SkillManifest");

const SkillDetailSchema = SkillSummarySchema.extend({
  manifest: SkillManifestSchema,
  files: z.array(z.string()),
}).openapi("SkillDetail");

const NameParam = z.string().regex(NAME_RE).openapi({ example: "my-skill" });
const VersionParam = z.string().regex(VERSION_RE).openapi({ example: "1.0.0" });

const listSkillsRoute = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      content: { "application/json": { schema: z.array(SkillSummarySchema) } },
      description: "List all skills",
    },
  },
});

const uploadSkillRoute = createRoute({
  method: "post",
  path: "/",
  request: {
    body: {
      content: {
        "multipart/form-data": {
          schema: z.object({
            skill: z.any().openapi({ type: "string", format: "binary" }),
          }),
        },
      },
    },
  },
  responses: {
    201: {
      content: { "application/json": { schema: SkillSummarySchema } },
      description: "Skill uploaded successfully",
    },
    400: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Bad request",
    },
    409: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Conflict — skill already exists",
    },
    413: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Tarball exceeds 5MB limit",
    },
  },
});

const getSkillRoute = createRoute({
  method: "get",
  path: "/{name}/{version}",
  request: {
    params: z.object({ name: NameParam, version: VersionParam }),
  },
  responses: {
    200: {
      content: { "application/json": { schema: SkillDetailSchema } },
      description: "Skill details",
    },
    404: {
      content: { "application/json": { schema: ErrorSchema } },
      description: "Skill not found",
    },
  },
});

export function skillsRoutes(db: Db, storage: Storage): OpenAPIHono {
  const app = new OpenAPIHono();

  app.openapi(listSkillsRoute, (c) => {
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

  app.openapi(uploadSkillRoute, async (c) => {
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

  app.openapi(getSkillRoute, async (c) => {
    const { name, version } = c.req.valid("param");
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
    return c.json(detail, 200);
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
