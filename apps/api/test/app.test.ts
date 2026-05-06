import { describe, it, expect } from "vitest";
import { app } from "../src/app.js";

describe("api GET /", () => {
  it("returns a Greeting JSON payload", async () => {
    const res = await app.request("/");
    expect(res.status).toBe(200);

    const body = (await res.json()) as { message: string; at: string };
    expect(body.message).toBe("hello from api");
    expect(typeof body.at).toBe("string");
    expect(Number.isNaN(Date.parse(body.at))).toBe(false);
  });
});
