import { useCallback, useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
    type NodePosition,
    useTaskPlannerState,
} from "@/src/components/rightPanel/states/taskPlannerState.ts";
import type { TaskPlannerPosition } from "@/src/types/task.ts";

type UseTaskPlannerPositionsParams = {
    taskIds?: string[];
};

export function useTaskPlannerPositions({
    taskIds,
}: UseTaskPlannerPositionsParams = {}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const nodePositions = useTaskPlannerState((state) => state.nodePositions);
    const moveNodeInState = useTaskPlannerState((state) => state.moveNode);
    const resetNodePositionsInState = useTaskPlannerState(
        (state) => state.resetNodePositions,
    );
    const setNodePositions = useTaskPlannerState((state) => state.setNodePositions);

    const taskIdSet = useMemo(
        () => (taskIds ? new Set(taskIds) : null),
        [taskIds],
    );

    const loadPlannerPositions = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await invoke<TaskPlannerPosition[]>(
                "list_task_planner_positions",
            );
            const nextPositions = result.reduce<Record<string, NodePosition>>(
                (positions, position) => {
                    if (!taskIdSet || taskIdSet.has(position.taskId)) {
                        positions[position.taskId] = {
                            x: position.x,
                            y: position.y,
                        };
                    }

                    return positions;
                },
                {},
            );

            setNodePositions(nextPositions);
            return nextPositions;
        } catch (e) {
            const message = String(e);
            setError(message);
            throw e;
        } finally {
            setLoading(false);
        }
    }, [setNodePositions, taskIdSet]);

    const saveNodePosition = useCallback(
        async (taskId: string, position: NodePosition) => {
            setError(null);
            moveNodeInState(taskId, position);

            try {
                await invoke<TaskPlannerPosition>("upsert_task_planner_position", {
                    taskId,
                    x: position.x,
                    y: position.y,
                });
            } catch (e) {
                const message = String(e);
                setError(message);
                throw e;
            }
        },
        [moveNodeInState],
    );

    const resetPlannerPositions = useCallback(async () => {
        setError(null);

        try {
            await invoke<number>("reset_task_planner_positions");
        } catch (e) {
            const message = String(e);
            setError(message);
            throw e;
        }

        resetNodePositionsInState();
    }, [resetNodePositionsInState]);

    useEffect(() => {
        loadPlannerPositions().catch(console.error);
    }, [loadPlannerPositions]);

    return {
        loading,
        error,
        nodePositions,
        loadPlannerPositions,
        saveNodePosition,
        resetPlannerPositions,
    };
}
