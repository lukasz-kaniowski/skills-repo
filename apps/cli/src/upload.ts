import { readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { create as tarCreate } from "tar";
import type { SkillManifest, SkillSummary } from "@repo/types";

export interface UploadOpts {
  dir: string;
  api: string;
}

export async function uploadSkill(opts: UploadOpts): Promise<SkillSummary> {
  const dir = resolve(opts.dir);
  const manifestRaw = await readFile(join(dir, "skill.json"), "utf8");
  const manifest = JSON.parse(manifestRaw) as SkillManifest;

  const entries = await readdir(dir);
  const pack = tarCreate({ cwd: dir, portable: true }, entries);
  const chunks: Buffer[] = [];
  for await (const chunk of pack) {
    chunks.push(Buffer.from(chunk as Uint8Array));
  }
  const tarball = Buffer.concat(chunks);

  const fd = new FormData();
  fd.append(
    "skill",
    new Blob([new Uint8Array(tarball)], { type: "application/x-tar" }),
    `${manifest.name}-${manifest.version}.tar`,
  );

  const res = await fetch(`${opts.api.replace(/\/$/, "")}/skills`, {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed (${res.status}): ${text}`);
  }
  return (await res.json()) as SkillSummary;
}
