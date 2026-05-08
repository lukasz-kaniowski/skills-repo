import { OpenAPIHono } from "@hono/zod-openapi";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { openDb, type Db } from "./core/db.js";
import { onError } from "./core/errors.js";
import { seedFromDir } from "./core/seed.js";
import { Storage } from "./core/storage.js";
import { greetingRoutes } from "./features/greeting/greeting.routes.js";
import { skillsRoutes } from "./features/skills/skills.routes.js";

export interface AppOpts {
  dataDir: string;
  seedDir?: string;
}

export interface AppHandle {
  app: OpenAPIHono;
  db: Db;
}

export async function createApp(opts: AppOpts): Promise<AppHandle> {
  const db = openDb(join(opts.dataDir, "meta.db"));
  const storage = new Storage(opts.dataDir);

  if (opts.seedDir && existsSync(opts.seedDir)) {
    await seedFromDir({ seedDir: opts.seedDir, dataDir: opts.dataDir, db, storage });
  }

  const app = new OpenAPIHono();
  app.onError(onError);

  app.route("/", greetingRoutes());
  app.route("/skills", skillsRoutes(db, storage));

  app.doc("/doc", {
    openapi: "3.0.0",
    info: {
      title: "Skills API",
      version: "0.0.1",
      description: "API for uploading, managing, and browsing reusable software skills",
    },
  });

  return { app, db };
}
