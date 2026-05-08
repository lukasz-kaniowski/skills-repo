import Link from "next/link";

interface FileNavProps {
  name: string;
  version: string;
  files: string[];
  selected: string | undefined;
}

export function FileNav({ name, version, files, selected }: FileNavProps) {
  return (
    <nav className="shrink-0">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        files
      </h2>
      <ul className="mt-2 space-y-1">
        {files.map((f) => (
          <li key={f}>
            <Link
              href={`/skills/${name}/${version}?file=${encodeURIComponent(f)}`}
              className={f === selected ? "font-bold" : ""}
            >
              {f}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
