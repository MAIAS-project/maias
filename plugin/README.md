# MAIAS — Claude Code plugin

One install delivers the full [MAIAS](https://github.com/MAIAS-project/maias) (Mobile App Information Architecture Schema) workflow: three skills for creating, editing, and reviewing app IA documents, plus the `maias` MCP server for validated, reference-safe machine operations.

## Install

```
/plugin marketplace add MAIAS-project/maias-plugin
/plugin install maias@maias
```

## What you get

| Component | What it does |
|---|---|
| `/maias:maias-create` | Turn an app description into a valid MAIAS document (spec-grounded, validator-verified) |
| `/maias:maias-edit` | Modify a document with reference integrity — renames cascade, removals refuse to dangle |
| `/maias:maias-review` | Validator pass + semantic IA critique (dead ends, navigation consistency, UX depth) |
| `maias` MCP server | `validate` / `query` / `edit` / `edit_elements` — runs via `npx -y @maias/mcp`, no setup |

The skills invoke automatically when you ask for IA work ("create an IA for a recipe app", "rename the checkout screen", "review my maias.yaml") — the slash forms are for explicit invocation.

## Requirements

Node.js ≥ 18 (`npx` fetches the [`@maias/cli`](https://www.npmjs.com/package/@maias/cli) and [`@maias/mcp`](https://www.npmjs.com/package/@maias/mcp) packages on demand).

## About this repository

This repo is a **distribution mirror** — its content is synced from the [MAIAS monorepo](https://github.com/MAIAS-project/maias) (`plugin/` directory). Please file issues and PRs there, not here. The bundled `reference/llms.txt` in each skill is the condensed MAIAS spec, copied from `docs/spec/llms.txt` at sync time.

Licensed under Apache-2.0 (see LICENSE, NOTICE).
