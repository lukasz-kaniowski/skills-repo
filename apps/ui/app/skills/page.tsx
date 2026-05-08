import Link from "next/link";
import { listSkills } from "@/app/api/client";

export default async function SkillsPage() {
  const skills = await listSkills();
  return (
    <main>
      <h1 className="text-2xl font-bold">skills</h1>
      {skills.length === 0 ? (
        <p className="mt-4 text-muted-foreground">no skills uploaded yet</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {skills.map((s) => (
            <li key={`${s.name}@${s.version}`}>
              <Link
                href={`/skills/${s.name}/${s.version}`}
                className="font-medium underline underline-offset-4"
              >
                {s.name}@{s.version}
              </Link>
              <span className="text-muted-foreground">
                {" "}
                — uploaded {s.uploadedAt}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
