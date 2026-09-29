---
title: "Verse"
description: "A Telegram-based AI assistant — chat interface, tool use, and a small plugin system for adding capabilities without redeploying."
status: "active"
startDate: 2025-09-01
endDate: null
repo: "https://github.com/Dannys-notepad/verse"
live: "https://t.me/UdemeAVXBot"
stack: ["JavaScript", "Node.js", "Firebase", "Telegram Bot API", "OpenAI API"]
featured: true
order: 1
openSource: true
---

Verse started as a way to stop copy-pasting ChatGPT answers into Telegram. It's now a small bot that keeps conversation state, calls tools when it needs to, and lets me add new capabilities without touching the core.

## What it does

- Keeps per-chat conversation history in Postgres
- Calls a small set of tools (web search, shell, a calculator) when the model decides to
- Loads plugins from a directory at startup — drop a `.go` file in, rebuild, done
- Streams responses back to Telegram as they arrive

## Why I built it

I wanted something I could use from my phone without opening a browser tab. The existing bots either locked you into a single model or wanted a subscription. This one is mine, runs on a cheap VPS, and I understand every line.

> The whole thing is about 900 lines of Go. That's the point — it should stay small enough to read in one sitting.

## Architecture

Two processes:

1. **The bot** — long-polls Telegram, handles commands, manages conversation state
2. **The worker** — picks up jobs from a Postgres queue, calls the model, writes results back

They talk through the database, not through each other. This means I can restart the bot without losing in-flight work, and the worker can be scaled independently if it ever needs to be.

## The plugin system

Plugins implement one interface:

```go
type Plugin interface {
    Name() string
    Description() string
    Schema() json.RawMessage
    Run(ctx context.Context, args json.RawMessage) (string, error)
}
```

At startup, the bot walks `plugins/`, `go:embeds` the directory, and registers each one with the tool-use loop. Adding a new tool is one file.

## What I'd do differently

- The Postgres queue works, but `LISTEN/NOTIFY` would be simpler than polling
- Conversation history grows unbounded — needs summarization
- The plugin interface is close to right, but `Run` should return a structured result, not a string

## Status

Active. I use it daily. Updates happen when something annoys me enough.

## Links

- [Repository](https://github.com/Dannys-notepad/verse)
- [Try it on Telegram](https://t.me/versebot)