import { PointerEvent, useMemo, useRef, useState } from "react";
import { useTaskPlannerState } from "./states/taskPlannerState.ts";
import type { NodePosition } from "./states/taskPlannerState.ts";
import type { Task } from "@/src/types/task.ts";
import { TaskPlannerLinks } from "./TaskPlannerLinks.tsx";
import { TaskPlannerNode } from "./TaskPlannerNode.tsx";
import {
  getDefaultPosition,
  NODE_HEIGHT,
  NODE_WIDTH,
} from "./taskPlannerGeometry.ts";

type DraggingNode = {
  taskId: string;
  startPointer: NodePosition;
  startPosition: NodePosition;
};

type TaskPlannerViewProps = {
  tasks: Task[];
};

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
    if (!activeConnector) {
      return;
    }

    event.stopPropagation();
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
      <TaskPlannerLinks
        activeConnector={activeConnector}
        canvasSize={canvasSize}
        links={visibleLinks}
        positions={positions}
      />

      {tasks.map((task) => (
        <TaskPlannerNode
          key={task.id}
          isDragging={draggingNode?.taskId === task.id}
          position={positions[task.id]}
          task={task}
          onConnectorPointerDown={handleConnectorPointerDown}
          onNodePointerDown={handleNodePointerDown}
          onNodePointerUp={handleConnectorTargetPointerUp}
        />
      ))}
    </div>
  );
}
