import type { SkillDetail, SkillSummary } from "@repo/types";

export const apiBase = (): string =>
  process.env.SKILLS_API ?? "http://localhost:3001";

export async function listSkills(): Promise<SkillSummary[]> {
  const res = await fetch(`${apiBase()}/skills`, { cache: "no-store" });
  if (!res.ok) throw new Error(`api ${res.status}`);
  return (await res.json()) as SkillSummary[];
}

export async function getSkill(name: string, version: string): Promise<SkillDetail> {
  const res = await fetch(
    `${apiBase()}/skills/${encodeURIComponent(name)}/${encodeURIComponent(version)}`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error(`api ${res.status}`);
  return (await res.json()) as SkillDetail;
}

export async function getSkillFile(
  name: string,
  version: string,
  path: string,
): Promise<string> {
  const segments = path.split("/").map(encodeURIComponent).join("/");
  const res = await fetch(
    `${apiBase()}/skills/${encodeURIComponent(name)}/${encodeURIComponent(version)}/files/${segments}`,
    { cache: "no-store" },
  );
  if (!res.ok) throw new Error(`api ${res.status}`);
  return await res.text();
}
