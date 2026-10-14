# Creamice Store: Build Kit

Everything an AI coding tool (Kilo Code) needs to build the Creamice online store without guessing.

## What is in here

| File | What it is |
| --- | --- |
| `AGENTS.md` | Standing rules the AI reads at the start of every task. Keep it in the project root. |
| `docs/PRD.md` | What to build, page by page, with the roles and the money rules |
| `docs/TECH_STACK.md` | Stack, free-plan reality check, architecture, payment steps |
| `docs/DATABASE.md` | Tables, permissions, order statuses |
| `supabase/schema.sql` | The database, ready to run in Supabase |
| `docs/DESIGN_SYSTEM.md` | Colours, fonts, components, motion, wireframes |
| `docs/TASKS.md` | The ordered plan from 14 to 28 October, with owner tasks |
| `docs/QA_AND_LAUNCH.md` | Test, security and go-live checklists |
| `docs/DECISIONS.md` | Choices made, assumptions to confirm, open questions |
| `docs/PROGRESS.md` | Running log, updated after every task |
| `.env.example` | The environment variables needed (no real values) |
| `public/brand/` | The three logo files supplied |
| `docs/reference/` | The brand guidelines PDF |

## First steps

1. Read `docs/DECISIONS.md` and answer the open items, especially hosting (D-1).
2. Start the owner tasks in `docs/TASKS.md` Part A today. Flutterwave verification takes the longest.
3. Open this folder in Kilo Code. It loads `AGENTS.md` automatically from the project root.
4. Give it one task at a time using the prompt in `docs/TASKS.md`. Review and test each result before the next.

## Principles

Simple over clever. One task at a time. The server decides prices, stock and payment results. Partners never see money. Test payments and permissions by hand.
