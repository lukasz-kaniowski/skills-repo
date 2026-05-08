import { OpenAPIHono } from "@hono/zod-openapi";
import type { SkillDetail, SkillManifest } from "@repo/types";
import type { Db } from "../../core/db.js";
import { NotFoundError } from "../../core/errors.js";
import type { Storage } from "../../core/storage.js";
import { listAll, findByNameVersion } from "./skills.repo.js";
import {
  listSkillsRoute,
  uploadSkillRoute,
  getSkillRoute,
} from "./skills.schemas.js";
import { uploadSkill } from "./skills.service.js";
import { MAX_TARBALL_BYTES } from "./skills.validation.js";

export function skillsRoutes(db: Db, storage: Storage): OpenAPIHono {
  const app = new OpenAPIHono();

  app.openapi(listSkillsRoute, (c) => {
    return c.json(listAll(db));
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
    const summary = await uploadSkill(buf, db, storage);
    return c.json(summary, 201);
  });

  app.openapi(getSkillRoute, async (c) => {
    const { name, version } = c.req.valid("param");
    const row = findByNameVersion(db, name, version);
    if (!row) throw new NotFoundError("not found");

    const files = await storage.listFiles(name, version);
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

    const content = await storage.readTextFile(name, version, relPath);
    return c.body(content, 200, { "content-type": "text/plain; charset=utf-8" });
  });

  return app;
}
