import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import type { Greeting } from "@repo/types";
import { openDb, type Db } from "./db.js";
import { Storage } from "./storage.js";
import { skillsRoutes } from "./routes/skills.js";
import { join } from "node:path";

export interface AppOpts {
  dataDir: string;
}

export interface AppHandle {
  app: OpenAPIHono;
  db: Db;
}

const GreetingSchema = z
  .object({
    message: z.string(),
    at: z.string().datetime(),
  })
  .openapi("Greeting");

const greetingRoute = createRoute({
  method: "get",
  path: "/",
  responses: {
    200: {
      content: { "application/json": { schema: GreetingSchema } },
      description: "Health check greeting",
    },
  },
});

export function createApp(opts: AppOpts): AppHandle {
  const db = openDb(join(opts.dataDir, "meta.db"));
  const storage = new Storage(opts.dataDir);

  const app = new OpenAPIHono();

  app.openapi(greetingRoute, (c) => {
    const greeting: Greeting = {
      message: "hello from api",
      at: new Date().toISOString(),
    };
    return c.json(greeting);
  });

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
