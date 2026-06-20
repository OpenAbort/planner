import { PointerEvent, useMemo, useRef, useState } from "react";
import { GitPullRequestArrow } from "lucide-react";
import { getTaskStatusOption } from "@/src/components/common/taskStatus.tsx";
import { useTaskPlannerState } from "./states/taskPlannerState.ts";
import type { NodePosition } from "./states/taskPlannerState.ts";
import type { Task } from "@/src/types/task.ts";
import { cn } from "@/lib/utils.ts";

const NODE_WIDTH = 190;
const NODE_HEIGHT = 82;
const GRID_LEFT = 40;
const GRID_TOP = 40;
const GRID_X = 240;
const GRID_Y = 130;
const GRID_COLUMNS = 3;

type DraggingNode = {
  taskId: string;
  startPointer: NodePosition;
  startPosition: NodePosition;
};

type TaskPlannerViewProps = {
  tasks: Task[];
};

function getDefaultPosition(index: number): NodePosition {
  return {
    x: GRID_LEFT + (index % GRID_COLUMNS) * GRID_X,
    y: GRID_TOP + Math.floor(index / GRID_COLUMNS) * GRID_Y,
  };
}

function getNodeCenter(position: NodePosition) {
  return {
    x: position.x + NODE_WIDTH / 2,
    y: position.y + NODE_HEIGHT / 2,
  };
}

export function TaskPlannerView({ tasks }: TaskPlannerViewProps) {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const [draggingNode, setDraggingNode] = useState<DraggingNode | null>(null);
  const {
    activeConnector,
    addLink,
    cancelConnector,
    clearFeedback,
    feedback,
    links,
    moveNode,
    nodePositions,
    startConnector,
    updateConnector,
  } = useTaskPlannerState();

  const taskIndexById = useMemo(
    () => new Map(tasks.map((task, index) => [task.id, index])),
    [tasks],
  );

  const positions = useMemo(() => {
    const nextPositions: Record<string, NodePosition> = {};

    tasks.forEach((task, index) => {
      nextPositions[task.id] = nodePositions[task.id] ?? getDefaultPosition(index);
    });

    return nextPositions;
  }, [nodePositions, tasks]);

  const visibleLinks = links.filter(
    (link) => taskIndexById.has(link.prerequisiteTaskId) && taskIndexById.has(link.taskId),
  );

  const canvasSize = useMemo(() => {
    const allPositions = Object.values(positions);
    const maxX = Math.max(...allPositions.map((position) => position.x), 0);
    const maxY = Math.max(...allPositions.map((position) => position.y), 0);

    return {
      width: Math.max(900, maxX + NODE_WIDTH + 80),
      height: Math.max(680, maxY + NODE_HEIGHT + 80),
    };
  }, [positions]);

  function getCanvasPoint(event: PointerEvent): NodePosition {
    const rect = canvasRef.current?.getBoundingClientRect();

    return {
      x: event.clientX - (rect?.left ?? 0),
      y: event.clientY - (rect?.top ?? 0),
    };
  }

  function handleNodePointerDown(event: PointerEvent, taskId: string) {
    if (event.button !== 0) {
      return;
    }

    clearFeedback();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggingNode({
      taskId,
      startPointer: getCanvasPoint(event),
      startPosition: positions[taskId],
    });
  }

  function handlePointerMove(event: PointerEvent) {
    const point = getCanvasPoint(event);

    if (draggingNode) {
      moveNode(draggingNode.taskId, {
        x: Math.max(12, draggingNode.startPosition.x + point.x - draggingNode.startPointer.x),
        y: Math.max(12, draggingNode.startPosition.y + point.y - draggingNode.startPointer.y),
      });
      return;
    }

    if (activeConnector) {
      updateConnector(point);
    }
  }

  function handlePointerUp() {
    setDraggingNode(null);

    if (activeConnector) {
      cancelConnector();
    }
  }

  function handleConnectorPointerDown(event: PointerEvent, taskId: string) {
    event.stopPropagation();
    clearFeedback();
    const point = getCanvasPoint(event);
    startConnector(taskId, point);
  }

  function handleConnectorTargetPointerUp(event: PointerEvent, taskId: string) {
    event.stopPropagation();

    if (!activeConnector) {
      return;
    }

    addLink(activeConnector.prerequisiteTaskId, taskId);
  }

  if (tasks.length === 0) {
    return (
      <div className="right-panel-empty">
        <h2>No tasks yet</h2>
        <p>Add tasks from the left panel to plan prerequisites.</p>
      </div>
    );
  }

  return (
    <div
      className="task-planner-canvas"
      ref={canvasRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {feedback && <div className="task-planner-feedback">{feedback}</div>}
      <svg
        className="task-planner-links"
        style={{ width: canvasSize.width, height: canvasSize.height }}
        aria-hidden="true"
      >
        <defs>
          <marker
            id="planner-arrow"
            markerHeight="8"
            markerWidth="8"
            orient="auto"
            refX="7"
            refY="4"
          >
            <path d="M0,0 L8,4 L0,8 Z" fill="#64748b" />
          </marker>
        </defs>
        {visibleLinks.map((link) => {
          const source = getNodeCenter(positions[link.prerequisiteTaskId]);
          const target = getNodeCenter(positions[link.taskId]);

          return (
            <line
              key={`${link.prerequisiteTaskId}-${link.taskId}`}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              markerEnd="url(#planner-arrow)"
            />
          );
        })}
        {activeConnector && (
          <line
            className="active"
            x1={getNodeCenter(positions[activeConnector.prerequisiteTaskId]).x}
            y1={getNodeCenter(positions[activeConnector.prerequisiteTaskId]).y}
            x2={activeConnector.x}
            y2={activeConnector.y}
          />
        )}
      </svg>

      {tasks.map((task) => {
        const position = positions[task.id];
        const statusOption = getTaskStatusOption(task.status);
        const StatusIcon = statusOption.icon;

        return (
          <article
            key={task.id}
            className={cn(
              "task-planner-node",
              draggingNode?.taskId === task.id && "dragging",
            )}
            style={{
              left: position.x,
              top: position.y,
              width: NODE_WIDTH,
              minHeight: NODE_HEIGHT,
            }}
            onPointerDown={(event) => handleNodePointerDown(event, task.id)}
            onPointerUp={(event) => handleConnectorTargetPointerUp(event, task.id)}
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
              onPointerDown={(event) => handleConnectorPointerDown(event, task.id)}
            >
              <GitPullRequestArrow className="size-4" />
            </button>
          </article>
        );
      })}
    </div>
  );
}
