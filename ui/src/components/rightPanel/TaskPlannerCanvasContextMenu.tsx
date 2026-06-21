import { MousePointer2, RotateCcw, X } from "lucide-react";
import type { NodePosition } from "./states/taskPlannerState.ts";

type TaskPlannerCanvasContextMenuProps = {
  hasActiveConnector: boolean;
  position: NodePosition;
  onCancelConnector: () => void;
  onClose: () => void;
  onResetLayout: () => void;
};

export function TaskPlannerCanvasContextMenu({
  hasActiveConnector,
  position,
  onCancelConnector,
  onClose,
  onResetLayout,
}: TaskPlannerCanvasContextMenuProps) {
  return (
    <div
      className="task-planner-context-menu"
      style={{
        left: position.x,
        top: position.y,
      }}
      role="menu"
      aria-label="Task planner actions"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <button
        className="task-planner-context-menu-item"
        type="button"
        role="menuitem"
        onClick={() => {
          onResetLayout();
          onClose();
        }}
      >
        <RotateCcw className="size-4" />
        Reset layout
      </button>
      <button
        className="task-planner-context-menu-item"
        type="button"
        role="menuitem"
        disabled={!hasActiveConnector}
        onClick={() => {
          onCancelConnector();
          onClose();
        }}
      >
        <X className="size-4" />
        Cancel connector
      </button>
      <div className="task-planner-context-menu-hint">
        <MousePointer2 className="size-3.5" />
        Drag nodes or connector handles on the canvas
      </div>
    </div>
  );
}
