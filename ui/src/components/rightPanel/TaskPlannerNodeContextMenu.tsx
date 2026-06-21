import { Link2Off } from "lucide-react";
import type { NodePosition } from "./states/taskPlannerState.ts";

type TaskPlannerNodeContextMenuProps = {
  position: NodePosition;
  prerequisiteCount: number;
  taskTitle: string;
  onClearPrerequisites: () => void;
  onClose: () => void;
};

export function TaskPlannerNodeContextMenu({
  position,
  prerequisiteCount,
  taskTitle,
  onClearPrerequisites,
  onClose,
}: TaskPlannerNodeContextMenuProps) {
  return (
    <div
      className="task-planner-context-menu task-planner-node-context-menu"
      style={{
        left: position.x,
        top: position.y,
      }}
      role="menu"
      aria-label={`${taskTitle} actions`}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <button
        className="task-planner-context-menu-item"
        type="button"
        role="menuitem"
        disabled={prerequisiteCount === 0}
        onClick={() => {
          onClearPrerequisites();
          onClose();
        }}
      >
        <Link2Off className="size-4" />
        Clear prerequisites
      </button>
    </div>
  );
}
