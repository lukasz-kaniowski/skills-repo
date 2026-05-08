import { mkdir, readFile, readdir, rename, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { Readable } from "node:stream";
import { x as extractTar } from "tar";
import { ConflictError, NotFoundError } from "./errors.js";

export class Storage {
  constructor(private root: string) {}

  versionDir(name: string, version: string): string {
    return join(this.root, "skills", name, version);
  }

  async extractToStaging(tarball: Buffer): Promise<string> {
    const stagingDir = join(
      this.root,
      ".staging",
      `up-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    await mkdir(stagingDir, { recursive: true });
    await new Promise<void>((res, rej) => {
      Readable.from(tarball)
        .pipe(extractTar({ cwd: stagingDir, strict: true }))
        .on("finish", () => res())
        .on("error", rej);
    });
    return stagingDir;
  }

  async commit(stagingDir: string, name: string, version: string): Promise<void> {
    const finalDir = this.versionDir(name, version);
    if (existsSync(finalDir)) {
      throw new ConflictError(`${name}@${version} already exists`);
    }
    await mkdir(resolve(finalDir, ".."), { recursive: true });
    await rename(stagingDir, finalDir);
  }

  async cleanupStaging(stagingDir: string): Promise<void> {
    await rm(stagingDir, { recursive: true, force: true }).catch(() => {});
  }

  async deleteVersion(name: string, version: string): Promise<void> {
    await rm(this.versionDir(name, version), { recursive: true, force: true }).catch(
      () => {},
    );
  }

  async listFiles(name: string, version: string): Promise<string[]> {
    const dir = this.versionDir(name, version);
    if (!existsSync(dir)) throw new NotFoundError();
    const out = await walk(dir, dir);
    return out.sort();
  }

  async readTextFile(name: string, version: string, relPath: string): Promise<string> {
    const base = this.versionDir(name, version);
    const full = resolve(base, relPath);
    if (full !== base && !full.startsWith(base + sep)) {
      throw new NotFoundError();
    }
    if (!existsSync(full)) throw new NotFoundError();
    return readFile(full, "utf8");
  }
}

async function walk(base: string, dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walk(base, full)));
    } else if (entry.isFile()) {
      out.push(relative(base, full).split(sep).join("/"));
    }
  }
  return out;
}
