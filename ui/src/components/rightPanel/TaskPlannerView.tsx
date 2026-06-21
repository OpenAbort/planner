import {FormEvent, MouseEvent, PointerEvent, useEffect, useMemo, useRef, useState} from "react";
import type {NodePosition} from "./states/taskPlannerState.ts";
import {useTaskPlannerState} from "./states/taskPlannerState.ts";
import {useTaskPlannerPositions} from "@/src/hooks/useTaskPlannerPositions.ts";
import {useTaskPrerequisites} from "@/src/hooks/useTaskPrerequisites.ts";
import type {Task, TaskStatus} from "@/src/types/task.ts";
import {AddTaskDialog} from "@/src/components/common/dialogs/AddTaskDialog.tsx";
import {TaskPlannerCanvasContextMenu} from "./TaskPlannerCanvasContextMenu.tsx";
import {TaskPlannerLinks} from "./TaskPlannerLinks.tsx";
import {TaskPlannerNode} from "./TaskPlannerNode.tsx";
import {TaskPlannerNodeContextMenu} from "./TaskPlannerNodeContextMenu.tsx";
import {getDefaultPosition, NODE_HEIGHT, NODE_WIDTH,} from "./taskPlannerGeometry.ts";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 1.8;
const ZOOM_STEP = 0.1;

type DraggingNode = {
    taskId: string;
    startPointer: NodePosition;
    startPosition: NodePosition;
};

type TaskPlannerViewProps = {
    tasks: Task[];
    onAddTask: (
        title: string,
        description: string,
        status: TaskStatus,
    ) => Promise<Task>;
    onRequestTaskDetails: (taskId: string) => void;
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

export function TaskPlannerView({tasks, onAddTask, onRequestTaskDetails}: TaskPlannerViewProps) {
    const canvasRef = useRef<HTMLDivElement | null>(null);
    const graphViewportRef = useRef<HTMLDivElement | null>(null);
    const [draggingNode, setDraggingNode] = useState<DraggingNode | null>(null);
    const [contextMenu, setContextMenu] = useState<PlannerContextMenu | null>(null);
    const [pendingTaskPosition, setPendingTaskPosition] = useState<NodePosition | null>(null);
    const [taskTitle, setTaskTitle] = useState("");
    const [taskDescription, setTaskDescription] = useState("");
    const [taskStatus, setTaskStatus] = useState<TaskStatus>("OPEN");
    const [zoom, setZoom] = useState(1);
    const {
        activeConnector,
        cancelConnector,
        clearFeedback,
        feedback,
        moveNode,
        startConnector,
        updateConnector,
    } = useTaskPlannerState();

    const taskIds = useMemo(() => tasks.map((task) => task.id), [tasks]);
    const {
        nodePositions,
        resetPlannerPositions,
        saveNodePosition,
    } = useTaskPlannerPositions({taskIds});
    const {
        addPrerequisite,
        clearTaskPrerequisites,
        getPrerequisiteCount,
        visiblePrerequisiteLinks,
    } = useTaskPrerequisites({taskIds});

    const positions = useMemo(() => {
        const nextPositions: Record<string, NodePosition> = {};

        tasks.forEach((task, index) => {
            nextPositions[task.id] = nodePositions[task.id] ?? getDefaultPosition(index);
        });

        return nextPositions;
    }, [nodePositions, tasks]);

    const canvasSize = useMemo(() => {
        const allPositions = Object.values(positions);
        const maxX = Math.max(...allPositions.map((position) => position.x), 0);
        const maxY = Math.max(...allPositions.map((position) => position.y), 0);

        return {
            width: Math.max(900, maxX + NODE_WIDTH + 80),
            height: Math.max(680, maxY + NODE_HEIGHT + 80),
        };
    }, [positions]);

    const scaledCanvasSize = useMemo(
        () => ({
            width: canvasSize.width * zoom,
            height: canvasSize.height * zoom,
        }),
        [canvasSize, zoom],
    );

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
        const rect = graphViewportRef.current?.getBoundingClientRect();

        return {
            x: (event.clientX - (rect?.left ?? 0)) / zoom,
            y: (event.clientY - (rect?.top ?? 0)) / zoom,
        };
    }

    function getContextMenuPoint(event: MouseEvent<HTMLElement>): NodePosition {
        const rect = graphViewportRef.current?.getBoundingClientRect();

        return {
            x: (event.clientX - (rect?.left ?? 0)) / zoom,
            y: (event.clientY - (rect?.top ?? 0)) / zoom,
        };
    }

    function updateZoom(nextZoom: number) {
        setZoom(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(nextZoom.toFixed(2)))));
    }

    function resetTaskForm() {
        setTaskTitle("");
        setTaskDescription("");
        setTaskStatus("OPEN");
    }

    function closeAddTaskDialog() {
        setPendingTaskPosition(null);
        resetTaskForm();
    }

    async function handleAddTaskSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const title = taskTitle.trim();

        if (!title || !pendingTaskPosition) {
            return;
        }

        const createdTask = await onAddTask(
            title,
            taskDescription.trim(),
            taskStatus,
        );

        await saveNodePosition(createdTask.id, {
            x: Math.max(12, pendingTaskPosition.x),
            y: Math.max(12, pendingTaskPosition.y),
        });
        closeAddTaskDialog();
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
        if (event.button !== 0 || activeConnector) {
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
        const droppedNode = draggingNode
            ? {
                taskId: draggingNode.taskId,
                position: positions[draggingNode.taskId],
            }
            : null;

        setDraggingNode(null);

        if (activeConnector) {
            cancelConnector();
        }

        if (droppedNode) {
            void saveNodePosition(droppedNode.taskId, droppedNode.position);
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
        addPrerequisite(activeConnector.prerequisiteTaskId, taskId).catch(console.error);
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
            <div className="task-planner-zoom-controls" aria-label="Task planner zoom controls">
                <button
                    type="button"
                    aria-label="Zoom out"
                    disabled={zoom <= MIN_ZOOM}
                    onClick={() => updateZoom(zoom - ZOOM_STEP)}
                >
                    -
                </button>
                <span>{Math.round(zoom * 100)}%</span>
                <button
                    type="button"
                    aria-label="Zoom in"
                    disabled={zoom >= MAX_ZOOM}
                    onClick={() => updateZoom(zoom + ZOOM_STEP)}
                >
                    +
                </button>
                <button
                    type="button"
                    aria-label="Reset zoom"
                    onClick={() => updateZoom(1)}
                >
                    Reset
                </button>
            </div>
            <div
                className="task-planner-graph-viewport"
                ref={graphViewportRef}
                style={{
                    width: scaledCanvasSize.width,
                    height: scaledCanvasSize.height,
                }}
            >
                <div
                    className="task-planner-graph-layer"
                    style={{
                        width: canvasSize.width,
                        height: canvasSize.height,
                        transform: `scale(${zoom})`,
                    }}
                >
                    <TaskPlannerLinks
                        activeConnector={activeConnector}
                        canvasSize={canvasSize}
                        links={visiblePrerequisiteLinks}
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
                    onCreateTask={() => setPendingTaskPosition(contextMenu.position)}
                    onResetLayout={() => {
                        void resetPlannerPositions();
                    }}
                        />
                    )}

                    {contextMenu?.kind === "node" && (
                        <TaskPlannerNodeContextMenu
                            position={contextMenu.position}
                            prerequisiteCount={getPrerequisiteCount(contextMenu.taskId)}
                            taskTitle={
                                tasks.find((task) => task.id === contextMenu.taskId)?.title ??
                                "Task"
                            }
                            onClearPrerequisites={() =>
                                clearTaskPrerequisites(contextMenu.taskId)
                            }
                            onClose={closeContextMenu}
                            onOpenDetails={() => {
                                onRequestTaskDetails(contextMenu.taskId);
                                closeContextMenu();
                            }}
                        />
                    )}
                </div>
            </div>
            {pendingTaskPosition && (
                <AddTaskDialog
                    taskTitle={taskTitle}
                    taskDescription={taskDescription}
                    taskStatus={taskStatus}
                    onClose={closeAddTaskDialog}
                    onSubmit={(event) => {
                        handleAddTaskSubmit(event).catch(console.error);
                    }}
                    onTaskDescriptionChange={setTaskDescription}
                    onTaskStatusChange={setTaskStatus}
                    onTaskTitleChange={setTaskTitle}
                />
            )}
        </div>
    );
}
