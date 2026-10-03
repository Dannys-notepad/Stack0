---
title: "Verse"
description: "A Telegram-based AI chatbot built with Node.js and Express — context-aware conversations, web search, and Firebase-backed user and token management."
status: "active"
startDate: 2025-09-01
endDate: null
repo: "https://github.com/Dannys-notepad/verse"
live: "https://t.me/UdemeAVXBot"
stack: ["JavaScript", "Node.js", "Express", "Firebase", "Telegram Bot API", "Gemini API", "Tavily"]
featured: true
order: 1
openSource: true
---

Verse is a Telegram-based AI chatbot. It holds context-aware conversations, searches the web when an answer needs fresh information, and keeps track of users and their access through Firebase. Telegram is the only platform live today; the structure is set up so WhatsApp and others can be added later.

## What it does

- Generates context-aware AI responses through configurable providers (Gemini, with API key rotation across multiple keys)
- Searches the web via Tavily for up-to-date answers
- Manages users and token-based access in Firebase
- Runs Telegram in webhook mode in production, or polling mode locally with no HTTPS needed
- Stores messages encrypted, using a key from the environment
- Logs requests and errors, shuts down gracefully, and includes an optional memory watchdog that can restart the process

## Architecture

A single Express app boots the platform clients and wires them to the shared services:

- `app.js` — server startup, platform initialization, graceful shutdown
- `platforms/telegram` — the Telegram client and message handling
- `src/response/ai` — AI response generation
- `src/service` and `src/models` — user validation and token handling
- `src/db` — Firebase admin setup and the user repository
- `src/utils` — logging and helpers

Keeping each platform in its own folder under `platforms/` is what makes the multi-platform goal realistic: a new platform only needs its own client, and the AI, user and database layers stay the same.

## Running it

Requires Node.js 18+, `pnpm` (or `npm`), Firebase service account credentials and a Telegram bot token.

```bash
cp .env.example .env   # fill in your values
pnpm install
pnpm start
```

Configuration is all environment variables: Gemini and Tavily keys, model settings (default model, max tokens, temperature, timeout), Telegram mode and webhook settings, and the Firebase service account JSON as a single value. The full list is in the repo README.

## Status

Active. Telegram is the only live platform for now.

## Links

- [Repository](https://github.com/Dannys-notepad/verse)
- [Try it on Telegram](https://t.me/UdemeAVXBot)
