import Link from "next/link";
import { getSkill, getSkillFile } from "@/app/api/client";
import { FileNav } from "@/app/components/file-nav";
import { FileViewer } from "@/app/components/file-viewer";

interface PageProps {
  params: Promise<{ name: string; version: string }>;
  searchParams: Promise<{ file?: string }>;
}

export default async function SkillVersionPage({
  params,
  searchParams,
}: PageProps) {
  const { name, version } = await params;
  const { file: requestedFile } = await searchParams;
  const skill = await getSkill(name, version);
  const selected =
    requestedFile && skill.files.includes(requestedFile)
      ? requestedFile
      : skill.files[0];
  const content = selected
    ? await getSkillFile(name, version, selected)
    : null;

  return (
    <main>
      <p>
        <Link
          href="/skills"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; all skills
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-bold">
        {skill.name}@{skill.version}
      </h1>
      {skill.manifest.description && (
        <p className="mt-1">{skill.manifest.description}</p>
      )}
      <p className="mt-1 text-sm text-muted-foreground">
        uploaded {skill.uploadedAt}
      </p>
      <div className="mt-6 flex gap-8">
        <FileNav
          name={skill.name}
          version={skill.version}
          files={skill.files}
          selected={selected}
        />
        <FileViewer filename={selected} content={content} />
      </div>
    </main>
  );
}
