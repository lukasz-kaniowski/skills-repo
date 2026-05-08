export const apiBase = (): string =>
  process.env.SKILLS_API ?? "http://localhost:3001";
