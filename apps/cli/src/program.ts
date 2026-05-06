import { Command } from "commander";
import type { Greeting } from "@repo/types";

export function buildProgram(): Command {
  const program = new Command();

  program.name("skills").description("skills-repo cli").version("0.0.0");

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

  return program;
}
