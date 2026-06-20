import { create } from "zustand";

type TaskSelectionState = {
  selectedTaskId: string | null;
  selectTask: (id: string) => void;
  clearSelectedTask: () => void;
};

export const useTaskSelectionState = create<TaskSelectionState>((set) => ({
  selectedTaskId: null,
  selectTask: (id) => set({ selectedTaskId: id }),
  clearSelectedTask: () => set({ selectedTaskId: null }),
}));
