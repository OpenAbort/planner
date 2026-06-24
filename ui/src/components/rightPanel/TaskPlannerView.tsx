import {FormEvent, MouseEvent, useEffect, useMemo, useState} from "react";
import type {NodePosition} from "./states/taskPlannerState.ts";
import {useTaskPlannerState} from "./states/taskPlannerState.ts";
import {useAppPreference} from "@/src/hooks/useAppPreference.ts";
import {useTaskPlannerPositions} from "@/src/hooks/useTaskPlannerPositions.ts";
import {useTaskPrerequisites} from "@/src/hooks/useTaskPrerequisites.ts";
import type {Task, TaskStatus} from "@/src/types/task.ts";
import {AddTaskDialog} from "@/src/components/common/dialogs/AddTaskDialog.tsx";
import {TaskPlannerCanvasContextMenu} from "./TaskPlannerCanvasContextMenu.tsx";
import {TaskPlannerLinkContextMenu} from "./TaskPlannerLinkContextMenu.tsx";
import {TaskPlannerLinks} from "./TaskPlannerLinks.tsx";
import {TaskPlannerModeControls} from "./TaskPlannerModeControls.tsx";
import {TaskPlannerNode} from "./TaskPlannerNode.tsx";
import {TaskPlannerNodeContextMenu} from "./TaskPlannerNodeContextMenu.tsx";
import {TaskPlannerTaskCard} from "./TaskPlannerTaskCard.tsx";
import {TaskPlannerZoomControls} from "./TaskPlannerZoomControls.tsx";
import {getDefaultPosition, NODE_HEIGHT, NODE_WIDTH,} from "./taskPlannerGeometry.ts";
import {getAutoSortedPositions} from "./taskPlannerLayout.ts";
import {useCanvasInteraction} from "./useCanvasInteraction.ts";
import type {PlannerMode} from "./useCanvasInteraction.ts";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 1.8;
const ZOOM_STEP = 0.1;
const PLANNER_ZOOM_PREFERENCE_KEY = "planner.zoom";

function clampZoom(nextZoom: number) {
    return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(nextZoom.toFixed(2))));
}

function parsePlannerZoomPreference(value: string) {
    const parsedValue = Number(value);

    return Number.isFinite(parsedValue)
        ? clampZoom(parsedValue)
        : null;
}

type TaskPlannerViewProps = {
    tasks: Task[];
    selectedTaskId: string | null;
    onAddTask: (
        title: string,
        description: string,
        status: TaskStatus,
        startDate: string | null,
        dueDate: string | null,
    ) => Promise<Task>;
    onUpdateTask: (task: {
        id: string;
        title: string;
        description: string;
        status: TaskStatus;
        startDate: string | null;
        dueDate: string | null;
    }) => Promise<Task | null>;
    onRequestTaskDetails: (taskId: string) => void;
};

type PlannerContextMenu =
    | {
    kind: "canvas";
    position: NodePosition;
}
    | {
    kind: "link";
    link: {
        prerequisiteTaskId: string;
        taskId: string;
        label: string | null;
    };
    position: NodePosition;
}
    | {
    kind: "node";
    position: NodePosition;
    taskId: string;
};

type ActiveTaskCard = {
    taskId: string;
    position: NodePosition;
};

export function TaskPlannerView({
                                    tasks,
                                    selectedTaskId,
                                    onAddTask,
                                    onUpdateTask,
                                    onRequestTaskDetails,
                                }: TaskPlannerViewProps) {
    const [contextMenu, setContextMenu] = useState<PlannerContextMenu | null>(null);
    const [pendingTaskPosition, setPendingTaskPosition] = useState<NodePosition | null>(null);
    const [taskTitle, setTaskTitle] = useState("");
    const [taskDescription, setTaskDescription] = useState("");
    const [taskStatus, setTaskStatus] = useState<TaskStatus>("OPEN");
    const [taskStartDate, setTaskStartDate] = useState("");
    const [taskDueDate, setTaskDueDate] = useState("");
    const [taskFormError, setTaskFormError] = useState<string | null>(null);
    const [linkLabelDraft, setLinkLabelDraft] = useState("");
    const [plannerMode, setPlannerMode] = useState<PlannerMode>("view");
    const [activeTaskCard, setActiveTaskCard] = useState<ActiveTaskCard | null>(null);
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
        deletePrerequisite,
        getPrerequisiteCount,
        updatePrerequisiteLabel,
        visiblePrerequisiteLinks,
    } = useTaskPrerequisites({taskIds});
    const {
        setValue: saveZoomPreference,
        value: zoom,
    } = useAppPreference({
        defaultValue: 1,
        deserialize: parsePlannerZoomPreference,
        key: PLANNER_ZOOM_PREFERENCE_KEY,
        serialize: String,
    });

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

    const {
        canvasRef,
        graphViewportRef,
        getCanvasPoint,
        selectedNodeIds,
        isPanning,
        isSelecting,
        selectionRect,
        isNodeDragging,
        resetInteractionState,
        handleNodePointerDown,
        handleNodeClick,
        handlePointerMove,
        handlePointerUp,
        handleConnectorPointerDown,
        handleConnectorTargetPointerUp,
        handleCanvasPointerDown,
    } = useCanvasInteraction({
        tasks,
        positions,
        zoom,
        plannerMode,
        activeConnector,
        isContextMenuOpen: contextMenu !== null,
        moveNode,
        saveNodePosition,
        startConnector,
        updateConnector,
        cancelConnector,
        addPrerequisite,
        onCloseContextMenu: closeContextMenu,
        onCloseTaskCard: () => setActiveTaskCard(null),
        onClearFeedback: clearFeedback,
        onShowTaskCard: showTaskCard,
    });

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

    useEffect(() => {
        if (!activeTaskCard) {
            return;
        }

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setActiveTaskCard(null);
            }
        }

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [activeTaskCard]);

    useEffect(() => {
        if (!selectedTaskId || !positions[selectedTaskId]) {
            return;
        }

        const canvas = canvasRef.current;

        if (!canvas) {
            return;
        }

        const selectedPosition = positions[selectedTaskId];
        const padding = 32;
        const nodeLeft = selectedPosition.x * zoom;
        const nodeTop = selectedPosition.y * zoom;
        const nodeRight = nodeLeft + NODE_WIDTH * zoom;
        const nodeBottom = nodeTop + NODE_HEIGHT * zoom;
        const viewLeft = canvas.scrollLeft;
        const viewTop = canvas.scrollTop;
        const viewRight = viewLeft + canvas.clientWidth;
        const viewBottom = viewTop + canvas.clientHeight;
        const isVisible =
            nodeLeft >= viewLeft + padding &&
            nodeTop >= viewTop + padding &&
            nodeRight <= viewRight - padding &&
            nodeBottom <= viewBottom - padding;

        if (isVisible) {
            return;
        }

        const nextLeft = nodeLeft + (NODE_WIDTH * zoom) / 2 - canvas.clientWidth / 2;
        const nextTop = nodeTop + (NODE_HEIGHT * zoom) / 2 - canvas.clientHeight / 2;

        requestAnimationFrame(() => {
            canvas.scrollTo({
                left: Math.max(0, nextLeft),
                top: Math.max(0, nextTop),
                behavior: "smooth",
            });
        });
    }, [positions, selectedTaskId, zoom]);

    function getUnscaledCanvasPoint(position: NodePosition): NodePosition {
        return {
            x: position.x * zoom,
            y: position.y * zoom,
        };
    }

    function updateZoom(nextZoom: number) {
        saveZoomPreference(clampZoom(nextZoom)).catch(console.error);
    }

    function handlePlannerModeChange(mode: PlannerMode) {
        setPlannerMode(mode);
        closeContextMenu();
        setActiveTaskCard(null);
        cancelConnector();
        resetInteractionState(mode !== "select");
    }

    // Opens the floating task card next to the given node.
    function showTaskCard(taskId: string) {
        const position = positions[taskId];

        if (!position) {
            return;
        }

        setActiveTaskCard({
            taskId,
            position: {
                x: position.x + NODE_WIDTH + 18,
                y: position.y,
            },
        });
    }

    function resetTaskForm() {
        setTaskTitle("");
        setTaskDescription("");
        setTaskStatus("OPEN");
        setTaskStartDate("");
        setTaskDueDate("");
        setTaskFormError(null);
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

        if (taskStartDate && taskDueDate && taskDueDate < taskStartDate) {
            setTaskFormError("Due date must be on or after start date.");
            return;
        }

        const createdTask = await onAddTask(
            title,
            taskDescription.trim(),
            taskStatus,
            taskStartDate || null,
            taskDueDate || null,
        );

        await saveNodePosition(createdTask.id, {
            x: Math.max(12, pendingTaskPosition.x),
            y: Math.max(12, pendingTaskPosition.y),
        });
        closeAddTaskDialog();
    }

    function closeContextMenu() {
        setContextMenu(null);
        setLinkLabelDraft("");
    }

    function handleContextMenu(event: MouseEvent<HTMLDivElement>) {
        event.preventDefault();

        if (plannerMode !== "edit") {
            closeContextMenu();
            return;
        }

        clearFeedback();
        setContextMenu({
            kind: "canvas",
            position: getCanvasPoint(event),
        });
    }

    function handleNodeContextMenu(event: MouseEvent<HTMLElement>, taskId: string) {
        event.preventDefault();
        event.stopPropagation();

        if (plannerMode !== "edit") {
            return;
        }

        clearFeedback();
        setContextMenu({
            kind: "node",
            position: getCanvasPoint(event),
            taskId,
        });
    }

    function handleOpenLinkMenu(
        link: { prerequisiteTaskId: string; taskId: string; label: string | null },
        position: NodePosition,
    ) {
        if (plannerMode !== "edit") {
            return;
        }

        clearFeedback();
        setLinkLabelDraft(link.label ?? "");
        setContextMenu({
            kind: "link",
            link,
            position,
        });
    }

    function handleUpdateTaskStatus(task: Task, status: TaskStatus) {
        if (task.status === status) {
            return;
        }

        onUpdateTask({
            id: task.id,
            title: task.title,
            description: task.description,
            status,
            startDate: task.startDate,
            dueDate: task.dueDate,
        }).catch(console.error);
    }

    async function handleAutoSortPlanner() {
        if (plannerMode !== "edit") {
            return;
        }

        closeContextMenu();
        clearFeedback();

        const nextPositions = getAutoSortedPositions(tasks, visiblePrerequisiteLinks);
        await Promise.all(
            tasks.map((task) => saveNodePosition(task.id, nextPositions[task.id])),
        );
    }

    async function handleSaveLinkLabel() {
        if (contextMenu?.kind !== "link") {
            return;
        }

        const updatedLink = await updatePrerequisiteLabel(
            contextMenu.link.prerequisiteTaskId,
            contextMenu.link.taskId,
            linkLabelDraft,
        );

        if (updatedLink) {
            closeContextMenu();
        }
    }

    async function handleDeleteLink() {
        if (contextMenu?.kind !== "link") {
            return;
        }

        await deletePrerequisite(
            contextMenu.link.prerequisiteTaskId,
            contextMenu.link.taskId,
        );
        closeContextMenu();
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
        <div className="task-planner-canvas-shell">
            {feedback && <div className="task-planner-feedback">{feedback}</div>}
            <div className="task-planner-floating-controls">
                <TaskPlannerModeControls mode={plannerMode} onModeChange={handlePlannerModeChange}/>
                <TaskPlannerZoomControls
                    canZoomIn={zoom < MAX_ZOOM}
                    canZoomOut={zoom > MIN_ZOOM}
                    zoom={zoom}
                    onResetZoom={() => updateZoom(1)}
                    onZoomIn={() => updateZoom(zoom + ZOOM_STEP)}
                    onZoomOut={() => updateZoom(zoom - ZOOM_STEP)}
                />
            </div>
            <div
                className={`task-planner-canvas${isPanning ? " panning" : ""}${isSelecting ? " selecting" : ""}`}
                ref={canvasRef}
                onContextMenu={handleContextMenu}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                onPointerDown={handleCanvasPointerDown}
            >
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
                            isEditMode={plannerMode === "edit"}
                            links={visiblePrerequisiteLinks}
                            onOpenLinkMenu={handleOpenLinkMenu}
                            positions={positions}
                        />

                        {selectionRect && (
                            <div
                                className="task-planner-selection-rect"
                                style={{
                                    left: selectionRect.left,
                                    top: selectionRect.top,
                                    width: selectionRect.width,
                                    height: selectionRect.height,
                                }}
                            />
                        )}

                        {tasks.map((task) => (
                            <TaskPlannerNode
                                key={task.id}
                                isEditMode={plannerMode === "edit"}
                                isDragging={isNodeDragging(task.id)}
                                isSelected={selectedTaskId === task.id || selectedNodeIds.has(task.id)}
                                position={positions[task.id]}
                                task={task}
                                onConnectorPointerDown={handleConnectorPointerDown}
                                onNodeClick={handleNodeClick}
                                onNodeContextMenu={handleNodeContextMenu}
                                onNodePointerDown={handleNodePointerDown}
                                onNodePointerUp={handleConnectorTargetPointerUp}
                                onStatusChange={handleUpdateTaskStatus}
                            />
                        ))}

                        {activeTaskCard && (
                            <TaskPlannerTaskCard
                                position={activeTaskCard.position}
                                prerequisiteLinks={visiblePrerequisiteLinks}
                                task={
                                    tasks.find((task) => task.id === activeTaskCard.taskId) ??
                                    tasks[0]
                                }
                                tasks={tasks}
                                onClose={() => setActiveTaskCard(null)}
                            />
                        )}
                    </div>

                    {contextMenu?.kind === "canvas" && (
                        <TaskPlannerCanvasContextMenu
                            hasActiveConnector={Boolean(activeConnector)}
                            position={getUnscaledCanvasPoint(contextMenu.position)}
                            onAutoSortLayout={() => {
                                handleAutoSortPlanner().catch(console.error);
                            }}
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
                            position={getUnscaledCanvasPoint(contextMenu.position)}
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

                    {contextMenu?.kind === "link" && (
                        <TaskPlannerLinkContextMenu
                            labelDraft={linkLabelDraft}
                            link={contextMenu.link}
                            position={getUnscaledCanvasPoint(contextMenu.position)}
                            onClose={closeContextMenu}
                            onDelete={() => {
                                handleDeleteLink().catch(console.error);
                            }}
                            onLabelDraftChange={setLinkLabelDraft}
                            onSaveLabel={() => {
                                handleSaveLinkLabel().catch(console.error);
                            }}
                        />
                    )}
                </div>
            </div>
            {pendingTaskPosition && (
                <AddTaskDialog
                    taskTitle={taskTitle}
                    taskDescription={taskDescription}
                    taskDueDate={taskDueDate}
                    taskStartDate={taskStartDate}
                    taskStatus={taskStatus}
                    formError={taskFormError}
                    onClose={closeAddTaskDialog}
                    onSubmit={(event) => {
                        handleAddTaskSubmit(event).catch(console.error);
                    }}
                    onTaskDescriptionChange={setTaskDescription}
                    onTaskDueDateChange={(value) => {
                        setTaskDueDate(value);
                        setTaskFormError(null);
                    }}
                    onTaskStartDateChange={(value) => {
                        setTaskStartDate(value);
                        setTaskFormError(null);
                    }}
                    onTaskStatusChange={setTaskStatus}
                    onTaskTitleChange={setTaskTitle}
                />
            )}
        </div>
    );
}
