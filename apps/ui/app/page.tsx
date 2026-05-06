import type { Greeting } from "@repo/types";

export default function Home() {
  const greeting: Greeting = {
    message: "hello from ui",
    at: new Date().toISOString(),
  };
  return (
    <main>
      <h1>{greeting.message}</h1>
      <p>{greeting.at}</p>
    </main>
  );
}
