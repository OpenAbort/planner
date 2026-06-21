import { useEffect, useRef, useState } from "react";
import type { MouseEvent, PointerEvent } from "react";
import { GitPullRequestArrow } from "lucide-react";
import { getTaskStatusOption, taskStatusOptions } from "@/src/components/common/taskStatus.tsx";
import type { Task, TaskStatus } from "@/src/types/task.ts";
import { cn } from "@/lib/utils.ts";
import type { NodePosition } from "./states/taskPlannerState.ts";
import { NODE_HEIGHT, NODE_WIDTH } from "./taskPlannerGeometry.ts";

type TaskPlannerNodeProps = {
  isDragging: boolean;
  isSelected: boolean;
  position: NodePosition;
  task: Task;
  onConnectorPointerDown: (event: PointerEvent, taskId: string) => void;
  onNodeContextMenu: (event: MouseEvent<HTMLElement>, taskId: string) => void;
  onNodePointerDown: (event: PointerEvent, taskId: string) => void;
  onNodePointerUp: (event: PointerEvent, taskId: string) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
};

export function TaskPlannerNode({
  isDragging,
  isSelected,
  position,
  task,
  onConnectorPointerDown,
  onNodeContextMenu,
  onNodePointerDown,
  onNodePointerUp,
  onStatusChange,
}: TaskPlannerNodeProps) {
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement | null>(null);
  const statusOption = getTaskStatusOption(task.status);
  const StatusIcon = statusOption.icon;

  useEffect(() => {
    if (!isStatusMenuOpen) {
      return;
    }

    function handlePointerDown(event: globalThis.PointerEvent) {
      if (
        event.target instanceof Node &&
        statusMenuRef.current?.contains(event.target)
      ) {
        return;
      }

      setIsStatusMenuOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsStatusMenuOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isStatusMenuOpen]);

  return (
    <article
      className={cn(
        "task-planner-node",
        isDragging && "dragging",
        isSelected && "selected",
      )}
      aria-current={isSelected ? "true" : undefined}
      style={{
        left: position.x,
        top: position.y,
        width: NODE_WIDTH,
        minHeight: NODE_HEIGHT,
      }}
      onPointerDown={(event) => {
        onNodePointerDown(event, task.id);
      }}
      onPointerUp={(event) => onNodePointerUp(event, task.id)}
      onContextMenu={(event) => onNodeContextMenu(event, task.id)}
    >
      <div className="task-planner-node-title">{task.title}</div>
      <div className="task-planner-node-status-wrap" ref={statusMenuRef}>
        <button
          className={cn("task-planner-node-status", statusOption.badgeClassName)}
          type="button"
          aria-expanded={isStatusMenuOpen}
          aria-haspopup="menu"
          title="Change task status"
          onClick={(event) => {
            event.stopPropagation();
            setIsStatusMenuOpen((isOpen) => !isOpen);
          }}
          onPointerDown={(event) => event.stopPropagation()}
        >
          <StatusIcon className="size-3.5" />
          {statusOption.label}
        </button>
        {isStatusMenuOpen && (
          <div
            className="task-planner-node-status-menu"
            role="menu"
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
          >
            {taskStatusOptions.map((option) => {
              const OptionIcon = option.icon;

              return (
                <button
                  key={option.value}
                  className={cn(
                    "task-planner-node-status-option",
                    option.optionClassName,
                    task.status === option.value && "selected",
                  )}
                  type="button"
                  role="menuitemradio"
                  aria-checked={task.status === option.value}
                  onClick={() => {
                    onStatusChange(task, option.value);
                    setIsStatusMenuOpen(false);
                  }}
                >
                  <OptionIcon className="size-3.5" />
                  {option.label}
                </button>
              );
            })}
          </div>
        )}
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
