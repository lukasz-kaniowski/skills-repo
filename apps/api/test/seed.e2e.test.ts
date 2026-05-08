import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { serve, type ServerType } from "@hono/node-server";
import type { SkillDetail, SkillSummary } from "@repo/types";
import { createApp, type AppHandle } from "../src/app.js";

describe("e2e: seed on startup", () => {
  let dataDir: string;
  let seedDir: string;
  let handle: AppHandle;
  let server: ServerType;
  let baseUrl: string;

  beforeAll(async () => {
    dataDir = await mkdtemp(join(tmpdir(), "skills-seed-data-"));
    seedDir = await mkdtemp(join(tmpdir(), "skills-seed-dir-"));

    await mkdir(join(seedDir, "seed-alpha", "prompts"), { recursive: true });
    await writeFile(
      join(seedDir, "seed-alpha", "skill.json"),
      JSON.stringify({ name: "seed-alpha", version: "1.0.0", description: "Alpha skill" }),
    );
    await writeFile(join(seedDir, "seed-alpha", "README.md"), "# Alpha");
    await writeFile(join(seedDir, "seed-alpha", "prompts", "hello.md"), "say hello");

    await mkdir(join(seedDir, "seed-beta"), { recursive: true });
    await writeFile(
      join(seedDir, "seed-beta", "skill.json"),
      JSON.stringify({ name: "seed-beta", version: "0.2.0", description: "Beta skill" }),
    );
    await writeFile(join(seedDir, "seed-beta", "notes.txt"), "some notes");

    handle = await createApp({ dataDir, seedDir });
    server = await new Promise<ServerType>((resolve) => {
      const s = serve({ fetch: handle.app.fetch, port: 0 }, () => resolve(s));
    });
    const addr = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${addr.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((res) => server.close(() => res()));
    handle.db.close();
    await rm(dataDir, { recursive: true, force: true });
    await rm(seedDir, { recursive: true, force: true });
  });

  it("lists both seeded skills", async () => {
    const list = (await fetch(`${baseUrl}/skills`).then((r) => r.json())) as SkillSummary[];
    expect(list).toHaveLength(2);
    const names = list.map((s) => s.name).sort();
    expect(names).toEqual(["seed-alpha", "seed-beta"]);
  });

  it("returns detail with files for a seeded skill", async () => {
    const detail = (await fetch(`${baseUrl}/skills/seed-alpha/1.0.0`).then((r) =>
      r.json(),
    )) as SkillDetail;
    expect(new Set(detail.files)).toEqual(
      new Set(["skill.json", "README.md", "prompts/hello.md"]),
    );
    expect(detail.manifest.description).toBe("Alpha skill");
  });

  it("serves seeded file content", async () => {
    const content = await fetch(
      `${baseUrl}/skills/seed-alpha/1.0.0/files/prompts/hello.md`,
    ).then((r) => r.text());
    expect(content).toBe("say hello");
  });
});
