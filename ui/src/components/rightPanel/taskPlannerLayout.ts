import type { Task } from "@/src/types/task.ts";
import type { NodePosition, PlannerLink } from "./states/taskPlannerState.ts";
import { GRID_LEFT, GRID_TOP } from "./taskPlannerGeometry.ts";

const AUTO_SORT_GRID_X = 360;
const AUTO_SORT_GRID_Y = 190;

/**
 * Lays tasks out left-to-right by prerequisite depth.
 *
 * Each task is placed in a layer equal to the longest prerequisite chain that
 * leads to it (a layered topological sort). Tasks within a layer keep their
 * original list order. Pure function: depends only on its arguments so it can
 * be unit tested in isolation.
 */
export function getAutoSortedPositions(
    tasks: Task[],
    links: PlannerLink[],
): Record<string, NodePosition> {
    const taskOrder = new Map(tasks.map((task, index) => [task.id, index]));
    const dependencyCount = new Map(tasks.map((task) => [task.id, 0]));
    const dependentsByPrerequisite = new Map<string, string[]>();
    const maxPrerequisiteLayer = new Map(tasks.map((task) => [task.id, 0]));

    links.forEach((link) => {
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

    // Tasks left unvisited (e.g. caught in a cycle) fall back to their highest
    // observed prerequisite layer so they still receive a position.
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
