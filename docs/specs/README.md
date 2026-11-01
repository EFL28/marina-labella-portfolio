# Specs

Every feature starts as a spec: a short Markdown document that we write and approve **before** any code is written. Specs are small: one per feature or vertical slice, not one per phase.

## Flow

1. **Draft:** copy [`_template.md`](_template.md) to `NNN-short-name.md` (next free number) and fill in Goal, Requirements and Acceptance criteria.
2. **Review:** Elian (and Marina, if it touches content or design) reads the draft. Open questions get answered in the doc.
3. **Approved:** set `Status: Approved`, add the Design and Tasks sections, and create the branch `feat/NNN-short-name` (ADR-015).
4. **In progress:** implement task by task, ticking boxes as you go. If reality differs from the spec, **update the spec first**.
5. **Done:** every acceptance criterion is checked, `pnpm check`, `pnpm format:check` and `pnpm build` pass, and the entry in [`../LOG.md`](../LOG.md) is written. Set `Status: Done` and merge the branch into `main`.

Statuses: `Draft` → `Approved` → `In progress` → `Done` (or `Dropped`, with a reason).

## Who does each task

Elian writes most of the code and is learning Astro along the way. Each task is tagged:

- **👤 Elian:** Elian implements it. The agent explains the concepts first, leaves a skeleton or `TODO(Elian)` markers if useful, and reviews the result.
- **🤖 Agent:** tedious or low-learning-value work (scripts, config, bulk content, boilerplate). The agent implements it and explains what it did.
- **🤝 Pair:** the agent builds the first instance step by step while explaining it, and Elian builds the next similar ones.

## Index

| #   | Spec                                            | Phase | Status      |
| --- | ----------------------------------------------- | ----- | ----------- |
| 001 | [Framer inventory](001-framer-inventory.md)     | 1     | Done        |
| 002 | [Design foundations](002-design-foundations.md) | 2     | In progress |
