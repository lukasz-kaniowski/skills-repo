import Link from "next/link";
import { listSkills } from "../api";

export default async function SkillsPage() {
  const skills = await listSkills();
  return (
    <main>
      <h1>skills</h1>
      {skills.length === 0 ? (
        <p>no skills uploaded yet</p>
      ) : (
        <ul>
          {skills.map((s) => (
            <li key={`${s.name}@${s.version}`}>
              <Link href={`/skills/${s.name}/${s.version}`}>
                {s.name}@{s.version}
              </Link>
              <span> — uploaded {s.uploadedAt}</span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
