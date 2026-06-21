# Project Context

OpenAbort Planner is a local task planning application. It provides a left panel for task list management and a right panel with two workspace views: task details and a visual task planner canvas.

## Core User Workflows

- Create tasks with title, description, and status.
- Select a task in the left panel and view or edit details in the right panel.
- Reorder tasks in the left panel.
- Bulk-select and delete tasks.
- Use the planner canvas to position task nodes.
- Connect tasks with prerequisite links.
- Right-click the canvas for planner actions.
- Right-click a node for node-specific actions.
- Update task status directly from task details or from a planner node.

## Task Statuses

Frontend task statuses are defined in `src/types/task.ts`:

- `OPEN`
- `IN PROGRESS`
- `IMPLEMENTED`
- `CLOSE`

Display metadata, labels, colors, and icons live in `src/components/common/taskStatus.tsx`.

## Shared Selection

The currently selected task lives in `src/states/taskSelectionState.ts`.

This state is shared between:

- `TaskPanel`, which highlights the active task in the list.
- `RightPanel`, which chooses the task shown in Details.
- `TaskPlannerView`, which highlights and scrolls to the selected planner node.

## Planner Canvas Concepts

The planner canvas uses logical coordinates. Zoom is applied with a transform on the graph layer, so pointer and context menu positions must be divided by the current zoom before use.

The planner has separate context menus:

- Canvas context menu: create task, reset layout, cancel connector.
- Node context menu: open details, clear prerequisites.

Node interactions include:

- Drag node to move it.
- Drag connector handle to another node to create a prerequisite link.
- Click status badge to update status inline.
- Right-click node for node actions.

## Backend Data

The Rust backend persists data to SQLite through Tauri commands. The database connection is managed by `ApplicationContainer` in `src-tauri/src/app/app_state.rs`.

The current persisted entities are:

- Tasks.
- Prerequisite links.
- Planner node positions.
