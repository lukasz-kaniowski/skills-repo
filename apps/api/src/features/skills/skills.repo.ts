import type { SkillSummary } from "@repo/types";
import type { Db } from "../../core/db.js";
import { ConflictError } from "../../core/errors.js";

export interface SkillRow {
  name: string;
  version: string;
  uploaded_at: string;
  manifest: string;
}

export function listAll(db: Db): SkillSummary[] {
  const rows = db
    .prepare(
      "SELECT name, version, uploaded_at FROM skill_versions ORDER BY uploaded_at DESC",
    )
    .all() as Array<{ name: string; version: string; uploaded_at: string }>;
  return rows.map((r) => ({
    name: r.name,
    version: r.version,
    uploadedAt: r.uploaded_at,
  }));
}

export function insert(
  db: Db,
  name: string,
  version: string,
  uploadedAt: string,
  manifestRaw: string,
): void {
  try {
    db.prepare(
      "INSERT INTO skill_versions (name, version, uploaded_at, manifest) VALUES (?, ?, ?, ?)",
    ).run(name, version, uploadedAt, manifestRaw);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("UNIQUE")) {
      throw new ConflictError(`${name}@${version} already exists`);
    }
    throw e;
  }
}

export function findByNameVersion(
  db: Db,
  name: string,
  version: string,
): SkillRow | undefined {
  return db
    .prepare(
      "SELECT name, version, uploaded_at, manifest FROM skill_versions WHERE name = ? AND version = ?",
    )
    .get(name, version) as SkillRow | undefined;
}
