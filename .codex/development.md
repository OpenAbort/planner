# Development Guide

## Environment

This project expects:

- Bun for frontend package scripts.
- Rust and Cargo for the Tauri backend.
- Tauri CLI through the `@tauri-apps/cli` package.

## Common Commands

From the repository root:

```powershell
bun run build
```

From `src-tauri`:

```powershell
cargo check
```

For local frontend-only development:

```powershell
bun run dev
```

For the Tauri desktop app:

```powershell
bun run desktop
```

## Verification Matrix

Use this as the default check strategy:

- TypeScript, React, CSS, or hook changes: run `bun run build`.
- Rust command, model, schema, or database changes: run `cargo check` from `src-tauri`.
- Tauri command contract changes: run both `bun run build` and `cargo check`.
- Pure markdown documentation changes: no build required.

## Adding A Tauri Command

1. Add or update Rust model types in `src-tauri/src/tasks/model.rs` if the command returns structured data.
2. Implement the command in `src-tauri/src/tasks/commands.rs`.
3. Register the command in `src-tauri/src/lib.rs`.
4. Add or update the matching TypeScript type in `src/types/`.
5. Call the command from a hook in `src/hooks/`.
6. Run `cargo check` and `bun run build`.

## Updating Planner Behavior

When editing planner interactions:

- Keep node dragging, connector creation, context menus, and inline controls from fighting for the same pointer events.
- Use `event.stopPropagation()` for controls inside a node that should not drag the node.
- Use logical canvas coordinates for persisted node positions.
- Account for `zoom` when converting pointer coordinates.
- Keep canvas context menu actions in `TaskPlannerCanvasContextMenu.tsx`.
- Keep node context menu actions in `TaskPlannerNodeContextMenu.tsx`.

## Updating Persistence

SQLite schema is initialized in `src-tauri/src/app/app_state.rs`.

When adding persisted data:

- Prefer a new table or explicit columns.
- Keep foreign keys enabled and cascading deletes where entity ownership is clear.
- Keep frontend optimistic updates reversible if backend validation can fail.
- Add new ignored local database artifacts to `.gitignore` when needed.
