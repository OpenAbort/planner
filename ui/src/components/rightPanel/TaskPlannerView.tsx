import {FormEvent, MouseEvent, PointerEvent, useEffect, useMemo, useRef, useState} from "react";
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
import {getDefaultPosition, GRID_LEFT, GRID_TOP, NODE_HEIGHT, NODE_WIDTH,} from "./taskPlannerGeometry.ts";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 1.8;
const ZOOM_STEP = 0.1;
const AUTO_SORT_GRID_X = 360;
const AUTO_SORT_GRID_Y = 190;
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

type PlannerMode = "view" | "edit" | "select";

type DraggingNodes = {
    taskIds: string[];
    startPointer: NodePosition;
    startPositions: Record<string, NodePosition>;
};

type PanningCanvas = {
    pointerId: number;
    startPointer: {
        x: number;
        y: number;
    };
    startScroll: {
        left: number;
        top: number;
    };
};

type SelectingNodes = {
    pointerId: number;
    startPoint: NodePosition;
    currentPoint: NodePosition;
};

type TaskPlannerViewProps = {
    tasks: Task[];
    selectedTaskId: string | null;
    onAddTask: (
        title: string,
        description: string,
        status: TaskStatus,
    ) => Promise<Task>;
    onUpdateTask: (task: {
        id: string;
        title: string;
        description: string;
        status: TaskStatus;
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
    const canvasRef = useRef<HTMLDivElement | null>(null);
    const graphViewportRef = useRef<HTMLDivElement | null>(null);
    const didDragNodeRef = useRef(false);
    const [draggingNodes, setDraggingNodes] = useState<DraggingNodes | null>(null);
    const [panningCanvas, setPanningCanvas] = useState<PanningCanvas | null>(null);
    const [selectingNodes, setSelectingNodes] = useState<SelectingNodes | null>(null);
    const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());
    const [contextMenu, setContextMenu] = useState<PlannerContextMenu | null>(null);
    const [pendingTaskPosition, setPendingTaskPosition] = useState<NodePosition | null>(null);
    const [taskTitle, setTaskTitle] = useState("");
    const [taskDescription, setTaskDescription] = useState("");
    const [taskStatus, setTaskStatus] = useState<TaskStatus>("OPEN");
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

    useEffect(() => {
        setSelectedNodeIds((currentSelectedNodeIds) => {
            const existingTaskIds = new Set(tasks.map((task) => task.id));
            const nextSelectedNodeIds = new Set(
                [...currentSelectedNodeIds].filter((taskId) => existingTaskIds.has(taskId)),
            );

            return nextSelectedNodeIds.size === currentSelectedNodeIds.size
                ? currentSelectedNodeIds
                : nextSelectedNodeIds;
        });
    }, [tasks]);

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
        setDraggingNodes(null);
        setPanningCanvas(null);
        setSelectingNodes(null);

        if (mode !== "select") {
            setSelectedNodeIds(new Set());
        }
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
        setLinkLabelDraft("");
    }

    function getSelectionRect(selection: SelectingNodes) {
        const left = Math.min(selection.startPoint.x, selection.currentPoint.x);
        const top = Math.min(selection.startPoint.y, selection.currentPoint.y);
        const right = Math.max(selection.startPoint.x, selection.currentPoint.x);
        const bottom = Math.max(selection.startPoint.y, selection.currentPoint.y);

        return {
            left,
            top,
            right,
            bottom,
            width: right - left,
            height: bottom - top,
        };
    }

    function getNodeIdsInSelection(selection: SelectingNodes) {
        const rect = getSelectionRect(selection);

        return tasks
            .filter((task) => {
                const position = positions[task.id];

                if (!position) {
                    return false;
                }

                const nodeRight = position.x + NODE_WIDTH;
                const nodeBottom = position.y + NODE_HEIGHT;

                return (
                    nodeRight >= rect.left &&
                    position.x <= rect.right &&
                    nodeBottom >= rect.top &&
                    position.y <= rect.bottom
                );
            })
            .map((task) => task.id);
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
            position: getContextMenuPoint(event),
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
            position: getContextMenuPoint(event),
            taskId,
        });
    }

    function handleNodePointerDown(event: PointerEvent, taskId: string) {
        if (
            (plannerMode !== "edit" && plannerMode !== "select") ||
            event.button !== 0 ||
            activeConnector
        ) {
            return;
        }

        closeContextMenu();
        clearFeedback();
        event.currentTarget.setPointerCapture(event.pointerId);
        didDragNodeRef.current = false;
        const draggedTaskIds = plannerMode === "select" && selectedNodeIds.has(taskId)
            ? [...selectedNodeIds]
            : [taskId];

        if (plannerMode === "select" && !selectedNodeIds.has(taskId)) {
            setSelectedNodeIds(new Set([taskId]));
        }

        setDraggingNodes({
            taskIds: draggedTaskIds,
            startPointer: getCanvasPoint(event),
            startPositions: draggedTaskIds.reduce<Record<string, NodePosition>>(
                (startPositions, draggedTaskId) => {
                    startPositions[draggedTaskId] = positions[draggedTaskId];
                    return startPositions;
                },
                {},
            ),
        });
    }

    function handleNodeClick(taskId: string) {
        if (didDragNodeRef.current) {
            didDragNodeRef.current = false;
            return;
        }

        closeContextMenu();
        clearFeedback();

        if (plannerMode === "select") {
            setSelectedNodeIds(new Set([taskId]));
            return;
        }

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

    function handlePointerMove(event: PointerEvent) {
        if (contextMenu) {
            return;
        }

        if (panningCanvas) {
            const canvas = canvasRef.current;

            if (!canvas) {
                return;
            }

            canvas.scrollLeft =
                panningCanvas.startScroll.left -
                (event.clientX - panningCanvas.startPointer.x);
            canvas.scrollTop =
                panningCanvas.startScroll.top -
                (event.clientY - panningCanvas.startPointer.y);
            return;
        }

        const point = getCanvasPoint(event);

        if (draggingNodes) {
            if (
                Math.abs(point.x - draggingNodes.startPointer.x) > 3 ||
                Math.abs(point.y - draggingNodes.startPointer.y) > 3
            ) {
                didDragNodeRef.current = true;
            }

            draggingNodes.taskIds.forEach((taskId) => {
                const startPosition = draggingNodes.startPositions[taskId];

                if (!startPosition) {
                    return;
                }

                moveNode(taskId, {
                    x: Math.max(12, startPosition.x + point.x - draggingNodes.startPointer.x),
                    y: Math.max(12, startPosition.y + point.y - draggingNodes.startPointer.y),
                });
            });
            return;
        }

        if (selectingNodes) {
            setSelectingNodes({
                ...selectingNodes,
                currentPoint: point,
            });
            return;
        }

        if (activeConnector) {
            updateConnector(point);
        }
    }

    function handlePointerUp(event: PointerEvent) {
        const pointerUpPoint = getCanvasPoint(event);
        const droppedNodes = draggingNodes?.taskIds.map((taskId) => {
            const startPosition = draggingNodes.startPositions[taskId];

            return {
                taskId,
                position: startPosition
                    ? {
                        x: Math.max(
                            12,
                            startPosition.x + pointerUpPoint.x - draggingNodes.startPointer.x,
                        ),
                        y: Math.max(
                            12,
                            startPosition.y + pointerUpPoint.y - draggingNodes.startPointer.y,
                        ),
                    }
                    : positions[taskId],
            };
        }) ?? [];
        const completedSelection = selectingNodes;

        if (
            (panningCanvas?.pointerId === event.pointerId ||
                completedSelection?.pointerId === event.pointerId) &&
            event.currentTarget.hasPointerCapture(event.pointerId)
        ) {
            event.currentTarget.releasePointerCapture(event.pointerId);
        }

        setDraggingNodes(null);
        setPanningCanvas(null);
        setSelectingNodes(null);

        if (activeConnector) {
            cancelConnector();
        }

        if (completedSelection) {
            setSelectedNodeIds(new Set(getNodeIdsInSelection(completedSelection)));
        }

        if (droppedNodes.length > 0) {
            void Promise.all(
                droppedNodes.map((node) => saveNodePosition(node.taskId, node.position)),
            );
        }
    }

    function handleConnectorPointerDown(event: PointerEvent, taskId: string) {
        if (plannerMode !== "edit") {
            return;
        }

        event.stopPropagation();
        closeContextMenu();
        clearFeedback();
        const point = getCanvasPoint(event);
        startConnector(taskId, point);
    }

    function handleConnectorTargetPointerUp(event: PointerEvent, taskId: string) {
        if (plannerMode !== "edit" || !activeConnector) {
            return;
        }

        event.stopPropagation();
        addPrerequisite(activeConnector.prerequisiteTaskId, taskId).catch(console.error);
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
        }).catch(console.error);
    }

    function getAutoSortedPositions(): Record<string, NodePosition> {
        const taskOrder = new Map(tasks.map((task, index) => [task.id, index]));
        const dependencyCount = new Map(tasks.map((task) => [task.id, 0]));
        const dependentsByPrerequisite = new Map<string, string[]>();
        const maxPrerequisiteLayer = new Map(tasks.map((task) => [task.id, 0]));

        visiblePrerequisiteLinks.forEach((link) => {
            if (!dependencyCount.has(link.prerequisiteTaskId) || !dependencyCount.has(link.taskId)) {
                return;
            }

            dependencyCount.set(link.taskId, (dependencyCount.get(link.taskId) ?? 0) + 1);
            dependentsByPrerequisite.set(link.prerequisiteTaskId, [
                ...(dependentsByPrerequisite.get(link.prerequisiteTaskId) ?? []),
                link.taskId,
            ]);
        });

        const queue = tasks
            .filter((task) => dependencyCount.get(task.id) === 0)
            .map((task) => task.id);
        const layerByTaskId = new Map<string, number>();

        while (queue.length > 0) {
            queue.sort((leftTaskId, rightTaskId) => {
                const layerDelta =
                    (maxPrerequisiteLayer.get(leftTaskId) ?? 0) -
                    (maxPrerequisiteLayer.get(rightTaskId) ?? 0);

                if (layerDelta !== 0) {
                    return layerDelta;
                }

                return (taskOrder.get(leftTaskId) ?? 0) - (taskOrder.get(rightTaskId) ?? 0);
            });

            const taskId = queue.shift();

            if (!taskId) {
                continue;
            }

            const taskLayer = maxPrerequisiteLayer.get(taskId) ?? 0;
            layerByTaskId.set(taskId, taskLayer);

            for (const dependentTaskId of dependentsByPrerequisite.get(taskId) ?? []) {
                maxPrerequisiteLayer.set(
                    dependentTaskId,
                    Math.max(maxPrerequisiteLayer.get(dependentTaskId) ?? 0, taskLayer + 1),
                );
                dependencyCount.set(
                    dependentTaskId,
                    Math.max(0, (dependencyCount.get(dependentTaskId) ?? 0) - 1),
                );

                if (dependencyCount.get(dependentTaskId) === 0) {
                    queue.push(dependentTaskId);
                }
            }
        }

        tasks.forEach((task) => {
            if (!layerByTaskId.has(task.id)) {
                layerByTaskId.set(task.id, maxPrerequisiteLayer.get(task.id) ?? 0);
            }
        });

        const taskIdsByLayer = new Map<number, string[]>();

        tasks.forEach((task) => {
            const layer = layerByTaskId.get(task.id) ?? 0;
            taskIdsByLayer.set(layer, [...(taskIdsByLayer.get(layer) ?? []), task.id]);
        });

        const sortedPositions: Record<string, NodePosition> = {};

        [...taskIdsByLayer.entries()]
            .sort(([leftLayer], [rightLayer]) => leftLayer - rightLayer)
            .forEach(([layer, layerTaskIds]) => {
                layerTaskIds
                    .sort(
                        (leftTaskId, rightTaskId) =>
                            (taskOrder.get(leftTaskId) ?? 0) - (taskOrder.get(rightTaskId) ?? 0),
                    )
                    .forEach((taskId, rowIndex) => {
                        sortedPositions[taskId] = {
                            x: GRID_LEFT + layer * AUTO_SORT_GRID_X,
                            y: GRID_TOP + rowIndex * AUTO_SORT_GRID_Y,
                        };
                    });
            });

        return sortedPositions;
    }

    async function handleAutoSortPlanner() {
        if (plannerMode !== "edit") {
            return;
        }

        closeContextMenu();
        clearFeedback();

        const nextPositions = getAutoSortedPositions();
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

    function handleCanvasPointerDown(event: PointerEvent<HTMLDivElement>) {
        if (event.button !== 0) {
            return;
        }

        const target = event.target;
        const startedOnInteractiveElement =
            target instanceof Element &&
            Boolean(
                target.closest(
                    ".task-planner-node, .task-planner-floating-controls, .task-planner-context-menu, .task-planner-link-label, .task-planner-task-card",
                ),
            );

        closeContextMenu();
        setActiveTaskCard(null);

        if (startedOnInteractiveElement || activeConnector || draggingNodes) {
            return;
        }

        clearFeedback();
        event.currentTarget.setPointerCapture(event.pointerId);
        const startPoint = getCanvasPoint(event);

        if (plannerMode === "select") {
            setSelectingNodes({
                pointerId: event.pointerId,
                startPoint,
                currentPoint: startPoint,
            });
            setSelectedNodeIds(new Set());
            return;
        }

        setPanningCanvas({
            pointerId: event.pointerId,
            startPointer: {
                x: event.clientX,
                y: event.clientY,
            },
            startScroll: {
                left: event.currentTarget.scrollLeft,
                top: event.currentTarget.scrollTop,
            },
        });
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
                className={`task-planner-canvas${panningCanvas ? " panning" : ""}${selectingNodes ? " selecting" : ""}`}
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

                        {selectingNodes && (
                            <div
                                className="task-planner-selection-rect"
                                style={{
                                    left: getSelectionRect(selectingNodes).left,
                                    top: getSelectionRect(selectingNodes).top,
                                    width: getSelectionRect(selectingNodes).width,
                                    height: getSelectionRect(selectingNodes).height,
                                }}
                            />
                        )}

                        {tasks.map((task) => (
                            <TaskPlannerNode
                                key={task.id}
                                isEditMode={plannerMode === "edit"}
                                isDragging={Boolean(draggingNodes?.taskIds.includes(task.id))}
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
