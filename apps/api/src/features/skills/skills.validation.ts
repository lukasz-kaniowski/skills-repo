import type { SkillManifest } from "@repo/types";
import { ValidationError } from "../../core/errors.js";

export const NAME_RE = /^[a-z0-9][a-z0-9-]*$/;
export const VERSION_RE = /^[a-zA-Z0-9][a-zA-Z0-9.\-+]*$/;
export const MAX_TARBALL_BYTES = 5 * 1024 * 1024;

export function validateManifest(raw: string): SkillManifest {
  let manifest: SkillManifest;
  try {
    manifest = JSON.parse(raw);
  } catch {
    throw new ValidationError("skill.json is not valid JSON");
  }
  if (typeof manifest.name !== "string" || !NAME_RE.test(manifest.name)) {
    throw new ValidationError("manifest.name must match /^[a-z0-9][a-z0-9-]*$/");
  }
  if (typeof manifest.version !== "string" || !VERSION_RE.test(manifest.version)) {
    throw new ValidationError("manifest.version is missing or invalid");
  }
  return manifest;
}
