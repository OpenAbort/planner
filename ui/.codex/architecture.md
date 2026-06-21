# Architecture Notes

## Frontend

The React app starts at `src/main.tsx` and renders `src/App.tsx`.

`App.tsx` owns the main two-panel layout using `react-resizable-panels`:

- Left panel: `TaskPanel`.
- Resize separator: `react-resizable-panels` separator with local CSS.
- Right panel: `RightPanel`.

Task data is loaded and mutated through `src/hooks/useTasks.ts`, which calls Tauri commands with `@tauri-apps/api/core` `invoke`.

## Left Panel

Important files:

- `TaskPanel.tsx`: left panel orchestration, bulk selection, delete dialog, task list props.
- `TaskForm.tsx`: task creation entrypoint.
- `TaskList.tsx`: sortable task list container.
- `TaskItem.tsx`: individual task row, drag handle, active state, status badge, delete action.
- `states/leftPanelStates.ts`: local panel mode state.

The left panel keeps a UI-local task order in `App.tsx` through `onUITasks`. Reordering is currently client-side only.

## Right Panel

Important files:

- `RightPanel.tsx`: tab switching between Details and Task Planner.
- `TaskDetailsView.tsx`: form-based editing for selected task.
- `TaskPlannerView.tsx`: canvas interactions, zoom, context menus, drag and connector behavior.
- `TaskPlannerNode.tsx`: planner node presentation and node-local interactions.
- `TaskPlannerLinks.tsx`: SVG prerequisite links.
- `TaskPlannerCanvasContextMenu.tsx`: canvas menu.
- `TaskPlannerNodeContextMenu.tsx`: node menu.
- `taskPlannerGeometry.ts`: node sizing and default positions.
- `states/taskPlannerState.ts`: planner interaction state and local link/position helpers.

## Hooks

Important hooks:

- `useTasks`: task CRUD through Tauri.
- `useTaskPrerequisites`: prerequisite link loading and mutations.
- `useTaskPlannerPositions`: planner node position loading and mutations.

Hooks generally do an optimistic local update and persist through the backend command.

## Backend

Rust code lives in `src-tauri/src`.

Important files:

- `lib.rs`: Tauri app setup and command registration.
- `main.rs`: Tauri binary entrypoint.
- `app/app_state.rs`: SQLite connection and schema initialization.
- `tasks/model.rs`: Rust task, prerequisite, and planner position models.
- `tasks/commands.rs`: Tauri commands for task CRUD, prerequisite links, and planner positions.
- `core/persistent/in_mem/`: legacy in-memory persistence reference.

## Data Contract

Keep these files aligned when changing task-related data:

- Frontend type: `src/types/task.ts`
- Frontend hooks: `src/hooks/useTasks.ts`, `src/hooks/useTaskPrerequisites.ts`, `src/hooks/useTaskPlannerPositions.ts`
- Rust model: `src-tauri/src/tasks/model.rs`
- Rust commands: `src-tauri/src/tasks/commands.rs`
- Tauri command registration: `src-tauri/src/lib.rs`

Serde rename attributes in Rust models should match frontend camelCase fields where needed.
