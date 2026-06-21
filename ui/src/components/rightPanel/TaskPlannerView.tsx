import {MouseEvent, PointerEvent, useEffect, useMemo, useRef, useState} from "react";
import type {NodePosition} from "./states/taskPlannerState.ts";
import {useTaskPlannerState} from "./states/taskPlannerState.ts";
import type {Task} from "@/src/types/task.ts";
import {TaskPlannerCanvasContextMenu} from "./TaskPlannerCanvasContextMenu.tsx";
import {TaskPlannerLinks} from "./TaskPlannerLinks.tsx";
import {TaskPlannerNode} from "./TaskPlannerNode.tsx";
import {TaskPlannerNodeContextMenu} from "./TaskPlannerNodeContextMenu.tsx";
import {getDefaultPosition, NODE_HEIGHT, NODE_WIDTH,} from "./taskPlannerGeometry.ts";

type DraggingNode = {
    taskId: string;
    startPointer: NodePosition;
    startPosition: NodePosition;
};

type TaskPlannerViewProps = {
    tasks: Task[];
};

type PlannerContextMenu =
    | {
    kind: "canvas";
    position: NodePosition;
}
    | {
    kind: "node";
    position: NodePosition;
    taskId: string;
};

export function TaskPlannerView({tasks}: TaskPlannerViewProps) {
    const canvasRef = useRef<HTMLDivElement | null>(null);
    const [draggingNode, setDraggingNode] = useState<DraggingNode | null>(null);
    const [contextMenu, setContextMenu] = useState<PlannerContextMenu | null>(null);
    const {
        activeConnector,
        addLink,
        cancelConnector,
        clearFeedback,
        clearTaskPrerequisites,
        feedback,
        links,
        moveNode,
        nodePositions,
        resetNodePositions,
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

    const prerequisiteCountByTaskId = useMemo(() => {
        const counts = new Map<string, number>();

        visibleLinks.forEach((link) => {
            counts.set(link.taskId, (counts.get(link.taskId) ?? 0) + 1);
        });

        return counts;
    }, [visibleLinks]);

    const canvasSize = useMemo(() => {
        const allPositions = Object.values(positions);
        const maxX = Math.max(...allPositions.map((position) => position.x), 0);
        const maxY = Math.max(...allPositions.map((position) => position.y), 0);

        return {
            width: Math.max(900, maxX + NODE_WIDTH + 80),
            height: Math.max(680, maxY + NODE_HEIGHT + 80),
        };
    }, [positions]);

    useEffect(() => {
        if (!contextMenu) {
            return;
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setContextMenu(null);
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [contextMenu]);

    function getCanvasPoint(event: PointerEvent): NodePosition {
        const rect = canvasRef.current?.getBoundingClientRect();

        return {
            x: event.clientX - (rect?.left ?? 0),
            y: event.clientY - (rect?.top ?? 0),
        };
    }

    function getContextMenuPoint(event: MouseEvent<HTMLElement>): NodePosition {
        const canvas = canvasRef.current;
        const rect = canvas?.getBoundingClientRect();

        return {
            x: event.clientX - (rect?.left ?? 0) + (canvas?.scrollLeft ?? 0),
            y: event.clientY - (rect?.top ?? 0) + (canvas?.scrollTop ?? 0),
        };
    }

    function closeContextMenu() {
        setContextMenu(null);
    }

    function handleContextMenu(event: MouseEvent<HTMLDivElement>) {
        event.preventDefault();
        clearFeedback();
        setContextMenu({
            kind: "canvas",
            position: getContextMenuPoint(event),
        });
    }

    function handleNodeContextMenu(event: MouseEvent<HTMLElement>, taskId: string) {
        event.preventDefault();
        event.stopPropagation();
        clearFeedback();
        setContextMenu({
            kind: "node",
            position: getContextMenuPoint(event),
            taskId,
        });
    }

    function handleNodePointerDown(event: PointerEvent, taskId: string) {
        if (event.button !== 0) {
            return;
        }

        closeContextMenu();
        clearFeedback();
        event.currentTarget.setPointerCapture(event.pointerId);
        setDraggingNode({
            taskId,
            startPointer: getCanvasPoint(event),
            startPosition: positions[taskId],
        });
    }

    function handlePointerMove(event: PointerEvent) {
        if (contextMenu) {
            return;
        }

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
        closeContextMenu();
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
            onContextMenu={handleContextMenu}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerDown={(event) => {
                if (event.button === 0) {
                    closeContextMenu();
                }
            }}
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
                    onNodeContextMenu={handleNodeContextMenu}
                    onNodePointerDown={handleNodePointerDown}
                    onNodePointerUp={handleConnectorTargetPointerUp}
                />
            ))}

            {contextMenu?.kind === "canvas" && (
                <TaskPlannerCanvasContextMenu
                    hasActiveConnector={Boolean(activeConnector)}
                    position={contextMenu.position}
                    onCancelConnector={cancelConnector}
                    onClose={closeContextMenu}
                    onResetLayout={resetNodePositions}
                />
            )}

            {contextMenu?.kind === "node" && (
                <TaskPlannerNodeContextMenu
                    position={contextMenu.position}
                    prerequisiteCount={prerequisiteCountByTaskId.get(contextMenu.taskId) ?? 0}
                    taskTitle={
                        tasks.find((task) => task.id === contextMenu.taskId)?.title ??
                        "Task"
                    }
                    onClearPrerequisites={() =>
                        clearTaskPrerequisites(contextMenu.taskId)
                    }
                    onClose={closeContextMenu}
                />
            )}
        </div>
    );
}
