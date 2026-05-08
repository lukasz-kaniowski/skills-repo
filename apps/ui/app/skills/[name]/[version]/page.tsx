import Link from "next/link";
import { getSkill, getSkillFile } from "@/app/api";

interface PageProps {
  params: Promise<{ name: string; version: string }>;
  searchParams: Promise<{ file?: string }>;
}

export default async function SkillVersionPage({ params, searchParams }: PageProps) {
  const { name, version } = await params;
  const { file: requestedFile } = await searchParams;
  const skill = await getSkill(name, version);
  const selected =
    requestedFile && skill.files.includes(requestedFile)
      ? requestedFile
      : skill.files[0];
  const content = selected ? await getSkillFile(name, version, selected) : null;

  return (
    <main>
      <p>
        <Link href="/skills">← all skills</Link>
      </p>
      <h1>
        {skill.name}@{skill.version}
      </h1>
      {skill.manifest.description && <p>{skill.manifest.description}</p>}
      <p>
        <small>uploaded {skill.uploadedAt}</small>
      </p>
      <div style={{ display: "flex", gap: "2rem" }}>
        <nav>
          <h2>files</h2>
          <ul>
            {skill.files.map((f) => (
              <li key={f}>
                <Link
                  href={`/skills/${skill.name}/${skill.version}?file=${encodeURIComponent(f)}`}
                  style={{ fontWeight: f === selected ? "bold" : "normal" }}
                >
                  {f}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <section style={{ flex: 1 }}>
          {selected ? (
            <>
              <h2>{selected}</h2>
              <pre style={{ whiteSpace: "pre-wrap" }}>{content}</pre>
            </>
          ) : (
            <p>this skill has no files</p>
          )}
        </section>
      </div>
    </main>
  );
}
