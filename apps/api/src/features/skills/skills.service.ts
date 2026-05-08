import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { SkillSummary } from "@repo/types";
import type { Db } from "../../core/db.js";
import type { Storage } from "../../core/storage.js";
import { ValidationError } from "../../core/errors.js";
import { validateManifest } from "./skills.validation.js";
import { insert } from "./skills.repo.js";

export async function uploadSkill(
  buf: Buffer,
  db: Db,
  storage: Storage,
): Promise<SkillSummary> {
  const stagingDir = await storage.extractToStaging(buf);
  try {
    const manifestRaw = await readFile(
      join(stagingDir, "skill.json"),
      "utf8",
    ).catch(() => null);
    if (manifestRaw === null) {
      throw new ValidationError("skill.json not found at root of tarball");
    }

    const manifest = validateManifest(manifestRaw);
    await storage.commit(stagingDir, manifest.name, manifest.version);

    const uploadedAt = new Date().toISOString();
    try {
      insert(db, manifest.name, manifest.version, uploadedAt, manifestRaw);
    } catch (e) {
      await storage.deleteVersion(manifest.name, manifest.version);
      throw e;
    }

    return { name: manifest.name, version: manifest.version, uploadedAt };
  } finally {
    await storage.cleanupStaging(stagingDir);
  }
}
