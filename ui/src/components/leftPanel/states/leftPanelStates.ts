import {create} from "zustand/react";

interface LeftPanelStates {
    isTaskItemSelecting: boolean
    toggle: (newValue: boolean) => void
}

export const useLeftPanelState = create<LeftPanelStates>()(
    (set) => ({
        isTaskItemSelecting: false,
        toggle: (newValue: boolean) => set((_) => ({isTaskItemSelecting: newValue}))
    }),
)