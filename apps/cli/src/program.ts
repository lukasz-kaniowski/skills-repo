import { Command } from "commander";
import type { Greeting } from "@repo/types";
import { uploadSkill } from "./upload.js";

export function buildProgram(): Command {
  const program = new Command();

  program.name("skills").description("skills-repo cli").version("0.0.0");
  program.exitOverride();

  program
    .command("hello")
    .description("print a greeting")
    .option("-n, --name <name>", "who to greet", "world")
    .action((opts: { name: string }) => {
      const greeting: Greeting = {
        message: `hello, ${opts.name}`,
        at: new Date().toISOString(),
      };
      console.log(greeting.message);
      console.log(greeting.at);
    });

  program
    .command("upload <dir>")
    .description("upload a skill directory to the API")
    .option(
      "--api <url>",
      "API base URL",
      process.env.SKILLS_API ?? "http://localhost:3001",
    )
    .action(async (dir: string, opts: { api: string }) => {
      const result = await uploadSkill({ dir, api: opts.api });
      console.log(`Uploaded ${result.name}@${result.version} (${result.uploadedAt})`);
    });

  return program;
}
