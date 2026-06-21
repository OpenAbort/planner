import { useCallback, useMemo } from "react";
import { useTaskPlannerState } from "@/src/components/rightPanel/states/taskPlannerState.ts";
import type { TaskPrerequisiteLink } from "@/src/types/task.ts";

type UseTaskPrerequisitesParams = {
    taskIds?: string[];
};

export function useTaskPrerequisites({
    taskIds,
}: UseTaskPrerequisitesParams = {}) {
    const links = useTaskPlannerState((state) => state.links);
    const addLink = useTaskPlannerState((state) => state.addLink);
    const clearTaskPrerequisitesFromState = useTaskPlannerState(
        (state) => state.clearTaskPrerequisites,
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

    const addPrerequisite = useCallback(
        async (prerequisiteTaskId: string, taskId: string) => {
            const didAdd = addLink(prerequisiteTaskId, taskId);

            if (!didAdd) {
                return false;
            }

            return true;
        },
        [addLink],
    );

    const clearTaskPrerequisites = useCallback(
        async (taskId: string) => {
            clearTaskPrerequisitesFromState(taskId);
        },
        [clearTaskPrerequisitesFromState],
    );

    const getPrerequisiteCount = useCallback(
        (taskId: string) =>
            visiblePrerequisiteLinks.filter((link) => link.taskId === taskId).length,
        [visiblePrerequisiteLinks],
    );

    return {
        prerequisiteLinks: links as TaskPrerequisiteLink[],
        visiblePrerequisiteLinks,
        addPrerequisite,
        clearTaskPrerequisites,
        getPrerequisiteCount,
    };
}
