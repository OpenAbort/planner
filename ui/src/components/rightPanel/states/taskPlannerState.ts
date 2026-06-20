import { create } from "zustand";

export type NodePosition = {
  x: number;
  y: number;
};

export type PlannerLink = {
  prerequisiteTaskId: string;
  taskId: string;
};

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
  moveNode: (taskId: string, position: NodePosition) => void;
  startConnector: (prerequisiteTaskId: string, position: NodePosition) => void;
  updateConnector: (position: NodePosition) => void;
  cancelConnector: () => void;
  addLink: (prerequisiteTaskId: string, taskId: string) => boolean;
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
  moveNode: (taskId, position) =>
    set((state) => ({
      nodePositions: {
        ...state.nodePositions,
        [taskId]: position,
      },
    })),
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
  clearFeedback: () => set({ feedback: null }),
}));
