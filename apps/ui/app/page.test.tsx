import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import Home from "./page.js";

describe("ui Home page", () => {
  it("renders the greeting message and an ISO timestamp", () => {
    const html = renderToStaticMarkup(<Home />);

    expect(html).toContain("<h1>hello from ui</h1>");
    const match = html.match(/<p>([^<]+)<\/p>/);
    expect(match?.[1]).toBeDefined();
    expect(Number.isNaN(Date.parse(match![1]!))).toBe(false);
  });
});
