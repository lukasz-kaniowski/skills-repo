import { Hono } from "hono";
import type { Greeting } from "@repo/types";
import { openDb, type Db } from "./db.js";
import { Storage } from "./storage.js";
import { skillsRoutes } from "./routes/skills.js";
import { join } from "node:path";

export interface AppOpts {
  dataDir: string;
}

export interface AppHandle {
  app: Hono;
  db: Db;
}

export function createApp(opts: AppOpts): AppHandle {
  const db = openDb(join(opts.dataDir, "meta.db"));
  const storage = new Storage(opts.dataDir);

  const app = new Hono();

  app.get("/", (c) => {
    const greeting: Greeting = {
      message: "hello from api",
      at: new Date().toISOString(),
    };
    return c.json(greeting);
  });

  app.route("/skills", skillsRoutes(db, storage));

  return { app, db };
}
