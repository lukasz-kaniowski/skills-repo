import { serve } from "@hono/node-server";
import { resolve } from "node:path";
import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 3001);
const dataDir = resolve(process.env.SKILLS_DATA_DIR ?? "./data");

const seedDir =
  process.env.SKILLS_SEED === "1" ? resolve(dataDir, "..", "seed") : undefined;

if (seedDir) {
  console.log(`seeding from ${seedDir}`);
} else {
  console.log("seeding disabled");
}

const { app } = await createApp({ dataDir, seedDir });
serve({ fetch: app.fetch, port });
console.log(`api listening on http://localhost:${port} (data: ${dataDir})`);
