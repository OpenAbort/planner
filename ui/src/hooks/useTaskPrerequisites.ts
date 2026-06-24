import { useCallback, useEffect, useMemo, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTaskPlannerState } from "@/src/components/rightPanel/states/taskPlannerState.ts";
import type { TaskPrerequisiteLink } from "@/src/types/task.ts";

type UseTaskPrerequisitesParams = {
    taskIds?: string[];
};

export function useTaskPrerequisites({
    taskIds,
}: UseTaskPrerequisitesParams = {}) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const links = useTaskPlannerState((state) => state.links);
    const addLink = useTaskPlannerState((state) => state.addLink);
    const deleteLink = useTaskPlannerState((state) => state.deleteLink);
    const updateLinkLabelInState = useTaskPlannerState(
        (state) => state.updateLinkLabel,
    );
    const clearTaskPrerequisitesFromState = useTaskPlannerState(
        (state) => state.clearTaskPrerequisites,
    );
    const setPrerequisiteLinks = useTaskPlannerState(
        (state) => state.setPrerequisiteLinks,
    );

    const taskIdSet = useMemo(
        () => (taskIds ? new Set(taskIds) : null),
        [taskIds],
    );

    const visiblePrerequisiteLinks = useMemo(
        () =>
            taskIdSet
                ? links.filter(
                      (link) =>
                          taskIdSet.has(link.prerequisiteTaskId) &&
                          taskIdSet.has(link.taskId),
                  )
                : links,
        [links, taskIdSet],
    );

    const loadPrerequisites = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await invoke<TaskPrerequisiteLink[]>(
                "list_task_prerequisites",
            );
            setPrerequisiteLinks(result);
            return result;
        } catch (e) {
            const message = String(e);
            setError(message);
            throw e;
        } finally {
            setLoading(false);
        }
    }, [setPrerequisiteLinks]);

    const addPrerequisite = useCallback(
        async (prerequisiteTaskId: string, taskId: string) => {
            setError(null);

            // Optimistically add the link, then roll it back if the backend
            // rejects or fails to persist it so the store never diverges from
            // the database.
            const didAdd = addLink(prerequisiteTaskId, taskId);

            if (!didAdd) {
                return false;
            }

            let didPersist: boolean;

            try {
                didPersist = await invoke<boolean>("add_task_prerequisite", {
                    prerequisiteTaskId,
                    taskId,
                });
            } catch (e) {
                deleteLink(prerequisiteTaskId, taskId);
                const message = String(e);
                setError(message);
                throw e;
            }

            if (!didPersist) {
                deleteLink(prerequisiteTaskId, taskId);
                return false;
            }

            return true;
        },
        [addLink, deleteLink],
    );

    const clearTaskPrerequisites = useCallback(
        async (taskId: string) => {
            setError(null);

            try {
                await invoke<number>("clear_task_prerequisites", {
                    taskId,
                });
            } catch (e) {
                const message = String(e);
                setError(message);
                throw e;
            }

            clearTaskPrerequisitesFromState(taskId);
        },
        [clearTaskPrerequisitesFromState],
    );

    const deletePrerequisite = useCallback(
        async (prerequisiteTaskId: string, taskId: string) => {
            setError(null);

            let didDelete: boolean;

            try {
                didDelete = await invoke<boolean>("delete_task_prerequisite", {
                    prerequisiteTaskId,
                    taskId,
                });
            } catch (e) {
                const message = String(e);
                setError(message);
                throw e;
            }

            if (didDelete) {
                deleteLink(prerequisiteTaskId, taskId);
            }

            return didDelete;
        },
        [deleteLink],
    );

    const updatePrerequisiteLabel = useCallback(
        async (prerequisiteTaskId: string, taskId: string, label: string) => {
            setError(null);

            let updatedLink: TaskPrerequisiteLink | null;

            try {
                updatedLink = await invoke<TaskPrerequisiteLink | null>(
                    "update_task_prerequisite_label",
                    {
                        prerequisiteTaskId,
                        taskId,
                        label,
                    },
                );
            } catch (e) {
                const message = String(e);
                setError(message);
                throw e;
            }

            if (updatedLink) {
                updateLinkLabelInState(
                    updatedLink.prerequisiteTaskId,
                    updatedLink.taskId,
                    updatedLink.label,
                );
            }

            return updatedLink;
        },
        [updateLinkLabelInState],
    );

    const getPrerequisiteCount = useCallback(
        (taskId: string) =>
            visiblePrerequisiteLinks.filter((link) => link.taskId === taskId).length,
        [visiblePrerequisiteLinks],
    );

    useEffect(() => {
        loadPrerequisites().catch(console.error);
    }, [loadPrerequisites]);

    return {
        loading,
        error,
        prerequisiteLinks: links as TaskPrerequisiteLink[],
        visiblePrerequisiteLinks,
        loadPrerequisites,
        addPrerequisite,
        clearTaskPrerequisites,
        deletePrerequisite,
        getPrerequisiteCount,
        updatePrerequisiteLabel,
    };
}
