import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildProgram } from "../src/program.js";

describe("cli hello", () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("greets 'world' by default", () => {
    buildProgram().parse(["hello"], { from: "user" });

    expect(logSpy).toHaveBeenCalledTimes(2);
    expect(logSpy).toHaveBeenNthCalledWith(1, "hello, world");
    const at = logSpy.mock.calls[1]?.[0] as string;
    expect(Number.isNaN(Date.parse(at))).toBe(false);
  });

  it("greets the provided --name", () => {
    buildProgram().parse(["hello", "--name", "alice"], { from: "user" });

    expect(logSpy).toHaveBeenCalledTimes(2);
    expect(logSpy).toHaveBeenNthCalledWith(1, "hello, alice");
  });
});
