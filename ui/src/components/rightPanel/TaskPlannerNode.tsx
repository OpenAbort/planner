import type { PointerEvent } from "react";
import { GitPullRequestArrow } from "lucide-react";
import { getTaskStatusOption } from "@/src/components/common/taskStatus.tsx";
import type { Task } from "@/src/types/task.ts";
import { cn } from "@/lib/utils.ts";
import type { NodePosition } from "./states/taskPlannerState.ts";
import { NODE_HEIGHT, NODE_WIDTH } from "./taskPlannerGeometry.ts";

type TaskPlannerNodeProps = {
  isDragging: boolean;
  position: NodePosition;
  task: Task;
  onConnectorPointerDown: (event: PointerEvent, taskId: string) => void;
  onNodePointerDown: (event: PointerEvent, taskId: string) => void;
  onNodePointerUp: (event: PointerEvent, taskId: string) => void;
};

export function TaskPlannerNode({
  isDragging,
  position,
  task,
  onConnectorPointerDown,
  onNodePointerDown,
  onNodePointerUp,
}: TaskPlannerNodeProps) {
  const statusOption = getTaskStatusOption(task.status);
  const StatusIcon = statusOption.icon;

  return (
    <article
      className={cn("task-planner-node", isDragging && "dragging")}
      style={{
        left: position.x,
        top: position.y,
        width: NODE_WIDTH,
        minHeight: NODE_HEIGHT,
      }}
      onPointerDown={(event) => onNodePointerDown(event, task.id)}
      onPointerUp={(event) => onNodePointerUp(event, task.id)}
    >
      <div className="task-planner-node-title">{task.title}</div>
      <div className={cn("task-planner-node-status", statusOption.badgeClassName)}>
        <StatusIcon className="size-3.5" />
        {statusOption.label}
      </div>
      <button
        className="task-planner-connector"
        type="button"
        aria-label={`Connect ${task.title} as a prerequisite`}
        title="Drag to another task to create a prerequisite"
        onPointerDown={(event) => onConnectorPointerDown(event, task.id)}
      >
        <GitPullRequestArrow className="size-4" />
      </button>
    </article>
  );
}
