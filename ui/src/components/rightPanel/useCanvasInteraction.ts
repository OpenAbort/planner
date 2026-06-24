import {PointerEvent, useEffect, useRef, useState} from "react";
import type {NodePosition} from "./states/taskPlannerState.ts";
import type {Task} from "@/src/types/task.ts";
import {NODE_HEIGHT, NODE_WIDTH} from "./taskPlannerGeometry.ts";

type PlannerMode = "view" | "edit" | "select";

type ActiveConnector = {
    prerequisiteTaskId: string;
    x: number;
    y: number;
} | null;

type DraggingNodes = {
    taskIds: string[];
    startPointer: NodePosition;
    startPositions: Record<string, NodePosition>;
};

type PanningCanvas = {
    pointerId: number;
    startPointer: {x: number; y: number};
    startScroll: {left: number; top: number};
};

type SelectingNodes = {
    pointerId: number;
    startPoint: NodePosition;
    currentPoint: NodePosition;
};

type SelectionRect = {
    left: number;
    top: number;
    right: number;
    bottom: number;
    width: number;
    height: number;
};

const DRAG_THRESHOLD = 3;
const MIN_NODE_POSITION = 12;

// Selector matching the elements that should never start a canvas pan/select
// because they own their own pointer behavior.
const INTERACTIVE_ELEMENT_SELECTOR =
    ".task-planner-node, .task-planner-floating-controls, .task-planner-context-menu, .task-planner-link-label, .task-planner-task-card";

type UseCanvasInteractionParams = {
    tasks: Task[];
    positions: Record<string, NodePosition>;
    zoom: number;
    plannerMode: PlannerMode;
    activeConnector: ActiveConnector;
    isContextMenuOpen: boolean;
    moveNode: (taskId: string, position: NodePosition) => void;
    saveNodePosition: (taskId: string, position: NodePosition) => Promise<unknown>;
    startConnector: (prerequisiteTaskId: string, position: NodePosition) => void;
    updateConnector: (position: NodePosition) => void;
    cancelConnector: () => void;
    addPrerequisite: (prerequisiteTaskId: string, taskId: string) => Promise<unknown>;
    // Cross-cutting view concerns invoked at interaction boundaries.
    onCloseContextMenu: () => void;
    onCloseTaskCard: () => void;
    onClearFeedback: () => void;
    onShowTaskCard: (taskId: string) => void;
};

function getSelectionRect(selection: SelectingNodes): SelectionRect {
    const left = Math.min(selection.startPoint.x, selection.currentPoint.x);
    const top = Math.min(selection.startPoint.y, selection.currentPoint.y);
    const right = Math.max(selection.startPoint.x, selection.currentPoint.x);
    const bottom = Math.max(selection.startPoint.y, selection.currentPoint.y);

    return {left, top, right, bottom, width: right - left, height: bottom - top};
}

/**
 * Owns all canvas pointer interaction state for the task planner: dragging
 * nodes, panning the viewport, rubber-band selection, and drawing prerequisite
 * connectors. Context menu, task card, and feedback are kept in the view and
 * driven through the callbacks in {@link UseCanvasInteractionParams}.
 */
export function useCanvasInteraction({
    tasks,
    positions,
    zoom,
    plannerMode,
    activeConnector,
    isContextMenuOpen,
    moveNode,
    saveNodePosition,
    startConnector,
    updateConnector,
    cancelConnector,
    addPrerequisite,
    onCloseContextMenu,
    onCloseTaskCard,
    onClearFeedback,
    onShowTaskCard,
}: UseCanvasInteractionParams) {
    const canvasRef = useRef<HTMLDivElement | null>(null);
    const graphViewportRef = useRef<HTMLDivElement | null>(null);
    const didDragNodeRef = useRef(false);
    const [draggingNodes, setDraggingNodes] = useState<DraggingNodes | null>(null);
    const [panningCanvas, setPanningCanvas] = useState<PanningCanvas | null>(null);
    const [selectingNodes, setSelectingNodes] = useState<SelectingNodes | null>(null);
    const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());

    // Drop selections that point at tasks which no longer exist.
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

    // Converts a screen-space pointer/mouse event into logical (zoom-adjusted)
    // canvas coordinates.
    function getCanvasPoint(event: {clientX: number; clientY: number}): NodePosition {
        const rect = graphViewportRef.current?.getBoundingClientRect();

        return {
            x: (event.clientX - (rect?.left ?? 0)) / zoom,
            y: (event.clientY - (rect?.top ?? 0)) / zoom,
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

    // Clears any in-flight drag/pan/selection. Used when the planner mode
    // changes so a half-finished gesture cannot leak across modes.
    function resetInteractionState(clearSelection: boolean) {
        setDraggingNodes(null);
        setPanningCanvas(null);
        setSelectingNodes(null);

        if (clearSelection) {
            setSelectedNodeIds(new Set());
        }
    }

    function handleNodePointerDown(event: PointerEvent, taskId: string) {
        if (
            (plannerMode !== "edit" && plannerMode !== "select") ||
            event.button !== 0 ||
            activeConnector
        ) {
            return;
        }

        onCloseContextMenu();
        onClearFeedback();
        event.currentTarget.setPointerCapture(event.pointerId);
        didDragNodeRef.current = false;
        const draggedTaskIds =
            plannerMode === "select" && selectedNodeIds.has(taskId)
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

        onCloseContextMenu();
        onClearFeedback();

        if (plannerMode === "select") {
            setSelectedNodeIds(new Set([taskId]));
            return;
        }

        onShowTaskCard(taskId);
    }

    function handlePointerMove(event: PointerEvent) {
        if (isContextMenuOpen) {
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
                Math.abs(point.x - draggingNodes.startPointer.x) > DRAG_THRESHOLD ||
                Math.abs(point.y - draggingNodes.startPointer.y) > DRAG_THRESHOLD
            ) {
                didDragNodeRef.current = true;
            }

            draggingNodes.taskIds.forEach((taskId) => {
                const startPosition = draggingNodes.startPositions[taskId];

                if (!startPosition) {
                    return;
                }

                moveNode(taskId, {
                    x: Math.max(
                        MIN_NODE_POSITION,
                        startPosition.x + point.x - draggingNodes.startPointer.x,
                    ),
                    y: Math.max(
                        MIN_NODE_POSITION,
                        startPosition.y + point.y - draggingNodes.startPointer.y,
                    ),
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
        const droppedNodes =
            draggingNodes?.taskIds.map((taskId) => {
                const startPosition = draggingNodes.startPositions[taskId];

                return {
                    taskId,
                    position: startPosition
                        ? {
                              x: Math.max(
                                  MIN_NODE_POSITION,
                                  startPosition.x + pointerUpPoint.x - draggingNodes.startPointer.x,
                              ),
                              y: Math.max(
                                  MIN_NODE_POSITION,
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
        onCloseContextMenu();
        onClearFeedback();
        startConnector(taskId, getCanvasPoint(event));
    }

    function handleConnectorTargetPointerUp(event: PointerEvent, taskId: string) {
        if (plannerMode !== "edit" || !activeConnector) {
            return;
        }

        event.stopPropagation();
        addPrerequisite(activeConnector.prerequisiteTaskId, taskId).catch(console.error);
    }

    function handleCanvasPointerDown(event: PointerEvent<HTMLDivElement>) {
        if (event.button !== 0) {
            return;
        }

        const target = event.target;
        const startedOnInteractiveElement =
            target instanceof Element &&
            Boolean(target.closest(INTERACTIVE_ELEMENT_SELECTOR));

        onCloseContextMenu();
        onCloseTaskCard();

        if (startedOnInteractiveElement || activeConnector || draggingNodes) {
            return;
        }

        onClearFeedback();
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

    return {
        canvasRef,
        graphViewportRef,
        getCanvasPoint,
        selectedNodeIds,
        isPanning: panningCanvas !== null,
        isSelecting: selectingNodes !== null,
        selectionRect: selectingNodes ? getSelectionRect(selectingNodes) : null,
        isNodeDragging: (taskId: string) =>
            Boolean(draggingNodes?.taskIds.includes(taskId)),
        resetInteractionState,
        handleNodePointerDown,
        handleNodeClick,
        handlePointerMove,
        handlePointerUp,
        handleConnectorPointerDown,
        handleConnectorTargetPointerUp,
        handleCanvasPointerDown,
    };
}

export type {PlannerMode};
