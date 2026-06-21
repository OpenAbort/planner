import { create } from "zustand";
import type { TaskPrerequisiteLink } from "@/src/types/task.ts";

export type NodePosition = {
  x: number;
  y: number;
};

export type PlannerLink = TaskPrerequisiteLink;

type ActiveConnector = {
  prerequisiteTaskId: string;
  x: number;
  y: number;
};

type TaskPlannerState = {
  nodePositions: Record<string, NodePosition>;
  links: PlannerLink[];
  activeConnector: ActiveConnector | null;
  feedback: string | null;
  setPrerequisiteLinks: (links: PlannerLink[]) => void;
  moveNode: (taskId: string, position: NodePosition) => void;
  resetNodePositions: () => void;
  startConnector: (prerequisiteTaskId: string, position: NodePosition) => void;
  updateConnector: (position: NodePosition) => void;
  cancelConnector: () => void;
  addLink: (prerequisiteTaskId: string, taskId: string) => boolean;
  clearTaskPrerequisites: (taskId: string) => void;
  clearFeedback: () => void;
};

function wouldCreateCycle(
  links: PlannerLink[],
  prerequisiteTaskId: string,
  taskId: string,
) {
  const dependentsByPrerequisite = new Map<string, string[]>();

  for (const link of links) {
    const dependents = dependentsByPrerequisite.get(link.prerequisiteTaskId) ?? [];
    dependents.push(link.taskId);
    dependentsByPrerequisite.set(link.prerequisiteTaskId, dependents);
  }

  const stack = [taskId];
  const visited = new Set<string>();

  while (stack.length > 0) {
    const currentTaskId = stack.pop();

    if (!currentTaskId || visited.has(currentTaskId)) {
      continue;
    }

    if (currentTaskId === prerequisiteTaskId) {
      return true;
    }

    visited.add(currentTaskId);
    stack.push(...(dependentsByPrerequisite.get(currentTaskId) ?? []));
  }

  return false;
}

export const useTaskPlannerState = create<TaskPlannerState>((set, get) => ({
  nodePositions: {},
  links: [],
  activeConnector: null,
  feedback: null,
  setPrerequisiteLinks: (links) => set({ links }),
  moveNode: (taskId, position) =>
    set((state) => ({
      nodePositions: {
        ...state.nodePositions,
        [taskId]: position,
      },
    })),
  resetNodePositions: () => set({ nodePositions: {}, feedback: null }),
  startConnector: (prerequisiteTaskId, position) =>
    set({
      activeConnector: {
        prerequisiteTaskId,
        ...position,
      },
      feedback: null,
    }),
  updateConnector: (position) =>
    set((state) =>
      state.activeConnector
        ? {
            activeConnector: {
              ...state.activeConnector,
              ...position,
            },
          }
        : state,
    ),
  cancelConnector: () => set({ activeConnector: null }),
  addLink: (prerequisiteTaskId, taskId) => {
    const { links } = get();

    if (prerequisiteTaskId === taskId) {
      set({
        activeConnector: null,
        feedback: "A task cannot be its own prerequisite.",
      });
      return false;
    }

    if (
      links.some(
        (link) =>
          link.prerequisiteTaskId === prerequisiteTaskId && link.taskId === taskId,
      )
    ) {
      set({ activeConnector: null });
      return false;
    }

    if (wouldCreateCycle(links, prerequisiteTaskId, taskId)) {
      set({
        activeConnector: null,
        feedback: "That prerequisite would create a cycle.",
      });
      return false;
    }

    set({
      links: [...links, { prerequisiteTaskId, taskId }],
      activeConnector: null,
      feedback: null,
    });
    return true;
  },
  clearTaskPrerequisites: (taskId) =>
    set((state) => ({
      activeConnector: null,
      feedback: null,
      links: state.links.filter((link) => link.taskId !== taskId),
    })),
  clearFeedback: () => set({ feedback: null }),
}));
