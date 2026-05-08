import type { Greeting } from "@repo/types";

export default function Home() {
  const greeting: Greeting = {
    message: "hello from ui",
    at: new Date().toISOString(),
  };
  return (
    <main>
      <h1 className="text-2xl font-bold">{greeting.message}</h1>
      <p className="mt-2 text-muted-foreground">{greeting.at}</p>
    </main>
  );
}
