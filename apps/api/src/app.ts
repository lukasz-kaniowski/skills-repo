import { Hono } from "hono";
import type { Greeting } from "@repo/types";

export const app = new Hono();

app.get("/", (c) => {
  const greeting: Greeting = {
    message: "hello from api",
    at: new Date().toISOString(),
  };
  return c.json(greeting);
});
