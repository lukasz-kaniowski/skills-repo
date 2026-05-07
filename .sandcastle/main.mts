import { run, claudeCode } from "@ai-hero/sandcastle";
import { docker } from "@ai-hero/sandcastle/sandboxes/docker";

// Simple loop: an agent that picks open GitHub issues one by one and closes them.
// Run this with: npx tsx .sandcastle/main.mts
// Or add to package.json scripts: "sandcastle": "npx tsx .sandcastle/main.mts"

// @ts-ignore
await run({
  // A name for this run, shown as a prefix in log output.
  name: "worker",

  // Render progress and agent output live in the terminal (interactive UI).
  // Without this, sandcastle writes to .sandcastle/logs/<run>.log silently
  // and only prints a "tail -f" hint at the start.
  logging: { type: "stdout" },

  // Sandbox provider — Docker is the default runtime.
  // Persist the pnpm content-addressable store on the host so packages
  // downloaded by one iteration are reused by the next (and across runs).
  // The path inside the container must match $npm_config_store_dir from
  // the Dockerfile.
  sandbox: docker({
    mounts: [
      { hostPath: "~/.cache/sandcastle-pnpm-store", sandboxPath: "/home/agent/.pnpm-store" },
    ],
  }),

  // The agent provider. Pass a model string to claudeCode() — sonnet balances
  // capability and speed for most tasks. Switch to claude-opus-4-6 for harder
  // problems, or claude-haiku-4-5-20251001 for speed.
  agent: claudeCode("claude-opus-4-6"),

  // Path to the prompt file. Shell expressions inside are evaluated inside the
  // sandbox at the start of each iteration, so the agent always sees fresh data.
  promptFile: "./.sandcastle/prompt.md",

  // Maximum number of iterations (agent invocations) to run in a session.
  // Each iteration works on a single issue. Increase this to process more issues
  // per run, or set it to 1 for a single-shot mode.
  maxIterations: 3,

  // Branch strategy — merge-to-head creates a temporary branch for the agent
  // to work on, then merges the result back to HEAD when the run completes.
  // This is required when using copyToWorktree, since head mode bind-mounts
  // the host directory directly (no worktree to copy into).
  branchStrategy: { type: "merge-to-head" },

  // Copying host node_modules is skipped intentionally: macOS host binaries
  // (sharp, better-sqlite3, esbuild, etc.) are useless inside the Linux
  // container, so pnpm has to redo them anyway. With the store persisted on
  // the host (see `mounts` above), `pnpm install --prefer-offline` is fast.

  // Lifecycle hooks — commands grouped by where they run (host or sandbox).
  hooks: {
    sandbox: {
      // onSandboxReady runs once after the sandbox is initialised and the repo is
      // synced in, before the agent starts. Use it to install dependencies or run
      // any other setup steps your project needs.
      onSandboxReady: [{ command: "pnpm install --prefer-offline" }],
    },
  },
});
