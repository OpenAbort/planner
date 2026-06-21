# Codex Project Instructions

This repository is a Tauri 2 desktop task planner built with React 19, TypeScript, Vite, Tailwind CSS, shadcn-style UI primitives, Zustand, and a Rust backend using SQLite through `rusqlite`.

Use these instructions for AI-assisted work in this project.

## Primary Commands

- Install dependencies: `bun install`
- Frontend typecheck and build: `bun run build`
- Frontend dev server: `bun run dev`
- Tauri desktop dev app: `bun run desktop`
- Rust backend check: `cargo check` from `src-tauri`

Run `bun run build` after frontend changes. Run `cargo check` from `src-tauri` after Rust changes or when frontend changes touch Tauri command contracts.

## Project Shape

- `src/` contains the React application.
- `src/components/leftPanel/` contains task list, task creation, bulk selection, and reorder UI.
- `src/components/rightPanel/` contains task details and task planner canvas UI.
- `src/hooks/` contains Tauri-backed data hooks for tasks, prerequisites, and planner positions.
- `src/states/` contains shared client state such as selected task.
- `src/types/task.ts` is the frontend task contract.
- `src-tauri/src/tasks/` contains Rust task models and Tauri commands.
- `src-tauri/src/app/app_state.rs` owns the SQLite connection and schema creation.
- `src-tauri/src/core/persistent/in_mem/` is legacy in-memory persistence kept for reference; do not route new persistence through it.

## Coding Rules

- Prefer existing component patterns and CSS classes before introducing new abstractions.
- Keep UI state local unless it must be shared. Use Zustand only for cross-panel or canvas-wide state.
- Keep Tauri command payload names aligned with frontend `invoke` calls.
- Update both TypeScript types and Rust serde models when data contracts change.
- Persist task, prerequisite, and planner position data through SQLite-backed Tauri commands.
- Keep planner canvas math zoom-aware. Pointer coordinates should be converted from screen coordinates into logical canvas coordinates.
- Do not revert unrelated user changes.

## UI Guidelines

- The app is an operational planner, so favor dense, clear controls over decorative layout.
- Inputs, textareas, and selects must use the global focus treatment: black border color with a thick black focus ring. Do not add local blue focus borders or rings.
- Planner nodes should keep drag, connector, context menu, and inline edit interactions separate.
- Interactions inside nodes must stop pointer propagation when they should not drag the node.
- Use existing status helpers from `src/components/common/taskStatus.tsx`.
- Keep global styling in `src/App.css` unless the project introduces a component CSS pattern.

## Persistence Notes

SQLite is initialized in the Tauri app data directory. The schema currently includes:

- `tasks`
- `task_prerequisites`
- `task_planner_positions`

Planner prerequisites are directed links:

- `prerequisiteTaskId` is the required upstream task.
- `taskId` is the dependent task.

The backend validates self-links, missing tasks, duplicate links, and cycles.

## Documentation

Additional Codex context lives in `.codex/`:

- `.codex/project-context.md`
- `.codex/architecture.md`
- `.codex/development.md`
