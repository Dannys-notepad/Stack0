---
title: "Omah"
description: "A personal cloud coding agent that runs on GitHub Actions — submit a repo and a task from your phone, get a pull request back for review. Never merges."
status: "active"
startDate: 2026-10-07
endDate: null
repo: "https://github.com/Dannys-notepad/omah"
live: null
stack: ["TypeScript", "Node.js", "GitHub Actions", "Gemini API", "Groq", "Mistral", "NVIDIA", "Poolside", "Requesty"]
featured: true
order: 2
openSource: true
---

Omah is a personal cloud coding agent. You submit a repository and a task, and it clones the repo into an ephemeral GitHub Actions runner, explores the code, makes the change, verifies it with tests, and opens a pull request. You review the PR from wherever you are. It never merges.

The whole system runs on GitHub Actions and free-tier LLM keys. There is no server, no database, no queue service — the workflows are the system. Runs are serial by design: one task at a time.

## What it does

- Runs on a GitHub-hosted runner, so your devices only submit and read
- Uses free-tier Gemini, Groq, Mistral, NVIDIA, Poolside, and Requesty keys with automatic rotation and per-key exhaustion tracking
- Gives the agent five tools: `read_file`, `request_write`, `run_bash`, `git_commit`, `finish`
- Compresses old tool results as the conversation grows, so token cost stays flat on long runs
- Runs an independent review gate before pushing: fresh tests, a deterministic scan for debug code and secrets, and a separate model that only sees the diff
- Refuses to push if a secret survives the fix round
- Opens every result as a pull request, ready for review when clean, draft when flagged
- Never merges, ever

## Architecture

A single TypeScript entry point plus a small set of focused modules:

- `agent.ts` — entry point. Orchestrates a run: workspace setup, the loop, the review gate, push
- `src/loop.ts` — the agent loop
- `src/tools.ts` — tool implementations and bash execution
- `src/review.ts` — review gate logic and the deterministic diff scan
- `src/history.ts` — history compression
- `src/llm.ts` — provider abstraction and key loading
- `src/keystate.ts` — per-key exhaustion persistence on a state branch
- `src/infra.ts` — process plumbing, workspace preparation, conversation persistence
- `prompts/` — the agent's and reviewer's system prompts, editable without touching code

Keeping the loop, tools, review, and process layers separate is what makes each one testable on its own: the loop takes injected dependencies, the review gate's pure logic has unit tests with no network, and the deterministic scan runs without a model.

## How a run works

1. **Trigger** — you run the workflow with a repo and a task, or use the `omah` CLI
2. **Setup** — the runner creates an unprivileged user, runs an isolation canary, and mints a short-lived GitHub App token scoped to one repository
3. **Loop** — the agent clones, calls a model, executes tool calls, repeats until `finish` or a budget
4. **Patch** — the orchestrator captures changes as a binary-safe patch and applies it to a fresh clone it controls
5. **Review gate** — tests run as the unprivileged user, the diff is scanned for debug code and secrets, a reviewer model returns a verdict
6. **Push** — the branch is pushed and a PR opened
7. **Notify** — an email with a deep link to the PR

## Security

The agent runs untrusted, LLM-generated commands. The design assumes it may eventually do something unexpected.

- The runner is disposable, one per run
- The agent runs as `omah-runner`, not as the workflow user
- The workspace holds no credentials; the orchestrator handles the push from a separate clone
- Tokens travel via environment variables, never `argv`
- The App token is scoped to one repo and expires in an hour
- `pkill -9 -u omah-runner` runs after the loop, before push
- Protected files are removed before the agent starts, and forbidden paths are rejected at commit time
- The review gate never runs project code as the orchestrator user

## Running it

Requires a GitHub App, repository secrets for the LLM keys, and a handful of repository variables. The README walks through setup.

```bash
npm link
omah config set control-repo owner/omah
omah run --repo owner/project --task "Add retry handling and tests"
```

## Status

Active, under active development. Personal tool, single user, not a SaaS. The current roadmap covers observability, checkpointed decomposition, and parallelism.

## Links

- [Repository](https://github.com/Dannys-notepad/omah)
