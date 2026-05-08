import { cp, mkdir, readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Db } from "./db.js";
import type { Storage } from "./storage.js";
import { validateManifest } from "../features/skills/skills.validation.js";
import { findByNameVersion, insert } from "../features/skills/skills.repo.js";

export interface SeedResult {
  seeded: string[];
  skipped: string[];
}

export async function seedFromDir(opts: {
  seedDir: string;
  dataDir: string;
  db: Db;
  storage: Storage;
}): Promise<SeedResult> {
  const { seedDir, db, storage } = opts;
  const seeded: string[] = [];
  const skipped: string[] = [];

  const entries = await readdir(seedDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const subDir = join(seedDir, entry.name);

    try {
      const manifestPath = join(subDir, "skill.json");
      const manifestRaw = await readFile(manifestPath, "utf8").catch(() => null);
      if (manifestRaw === null) {
        console.warn(`seed: ${entry.name}/ has no skill.json, skipping`);
        skipped.push(entry.name);
        continue;
      }

      const manifest = validateManifest(manifestRaw);
      const existing = findByNameVersion(db, manifest.name, manifest.version);
      if (existing) {
        skipped.push(`${manifest.name}@${manifest.version}`);
        continue;
      }

      const dst = storage.versionDir(manifest.name, manifest.version);
      if (existsSync(dst)) {
        skipped.push(`${manifest.name}@${manifest.version}`);
        continue;
      }

      await mkdir(join(dst, ".."), { recursive: true });
      await cp(subDir, dst, { recursive: true, errorOnExist: true });

      try {
        insert(db, manifest.name, manifest.version, new Date().toISOString(), manifestRaw);
      } catch (e) {
        await storage.deleteVersion(manifest.name, manifest.version);
        throw e;
      }

      seeded.push(`${manifest.name}@${manifest.version}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.warn(`seed: ${entry.name}/ failed: ${msg}`);
      skipped.push(entry.name);
    }
  }

  console.log(`seed: seeded ${seeded.length}, skipped ${skipped.length}`);
  return { seeded, skipped };
}
