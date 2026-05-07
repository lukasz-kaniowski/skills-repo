import { serve } from "@hono/node-server";
import { resolve } from "node:path";
import { createApp } from "./app.js";

const port = Number(process.env.PORT ?? 3001);
const dataDir = resolve(process.env.SKILLS_DATA_DIR ?? "./data");
const { app } = createApp({ dataDir });
serve({ fetch: app.fetch, port });
console.log(`api listening on http://localhost:${port} (data: ${dataDir})`);
