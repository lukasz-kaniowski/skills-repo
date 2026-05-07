import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import { serve, type ServerType } from "@hono/node-server";
import type { SkillDetail, SkillSummary } from "@repo/types";
import { createApp, type AppHandle } from "../src/app.js";
import { buildProgram } from "../../cli/src/program.js";

describe("e2e: cli upload -> api -> fetch", () => {
  let dataDir: string;
  let skillDir: string;
  let handle: AppHandle;
  let server: ServerType;
  let baseUrl: string;

  beforeAll(async () => {
    dataDir = await mkdtemp(join(tmpdir(), "skills-e2e-data-"));
    skillDir = await mkdtemp(join(tmpdir(), "skills-e2e-skill-"));

    handle = createApp({ dataDir });
    server = await new Promise<ServerType>((resolve) => {
      const s = serve({ fetch: handle.app.fetch, port: 0 }, () => resolve(s));
    });
    const addr = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${addr.port}`;

    await writeFile(
      join(skillDir, "skill.json"),
      JSON.stringify({ name: "demo", version: "1.0.0", description: "test skill" }),
    );
    await writeFile(join(skillDir, "README.md"), "# Demo\nhello world");
    await mkdir(join(skillDir, "prompts"));
    await writeFile(join(skillDir, "prompts", "greet.md"), "you are friendly");
  });

  afterAll(async () => {
    await new Promise<void>((res) => server.close(() => res()));
    handle.db.close();
    await rm(dataDir, { recursive: true, force: true });
    await rm(skillDir, { recursive: true, force: true });
  });

  it("uploads a skill via CLI and serves it from the API", async () => {
    await buildProgram().parseAsync([
      "node",
      "skills",
      "upload",
      skillDir,
      "--api",
      baseUrl,
    ]);

    const list = (await fetch(`${baseUrl}/skills`).then((r) => r.json())) as SkillSummary[];
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({ name: "demo", version: "1.0.0" });

    const detail = (await fetch(`${baseUrl}/skills/demo/1.0.0`).then((r) =>
      r.json(),
    )) as SkillDetail;
    expect(new Set(detail.files)).toEqual(
      new Set(["skill.json", "README.md", "prompts/greet.md"]),
    );
    expect(detail.manifest.description).toBe("test skill");

    const file = await fetch(`${baseUrl}/skills/demo/1.0.0/files/README.md`).then((r) =>
      r.text(),
    );
    expect(file).toBe("# Demo\nhello world");

    const nested = await fetch(
      `${baseUrl}/skills/demo/1.0.0/files/prompts/greet.md`,
    ).then((r) => r.text());
    expect(nested).toBe("you are friendly");
  });

  it("rejects re-upload of the same name@version with 409", async () => {
    await expect(
      buildProgram().parseAsync([
        "node",
        "skills",
        "upload",
        skillDir,
        "--api",
        baseUrl,
      ]),
    ).rejects.toThrow(/409/);
  });

  it("rejects path traversal attempts with 404", async () => {
    const res = await fetch(
      `${baseUrl}/skills/demo/1.0.0/files/${encodeURIComponent("../../../etc/passwd")}`,
    );
    expect(res.status).toBe(404);
  });
});
