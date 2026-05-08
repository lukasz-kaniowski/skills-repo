interface FileViewerProps {
  filename: string | undefined;
  content: string | null;
}

export function FileViewer({ filename, content }: FileViewerProps) {
  if (!filename) {
    return <p className="text-muted-foreground">this skill has no files</p>;
  }

  return (
    <section className="min-w-0 flex-1">
      <h2 className="text-lg font-medium">{filename}</h2>
      <pre className="mt-2 whitespace-pre-wrap rounded-md bg-muted p-4 text-sm">
        {content}
      </pre>
    </section>
  );
}
