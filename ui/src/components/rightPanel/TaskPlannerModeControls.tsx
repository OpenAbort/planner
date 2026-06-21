type PlannerMode = "view" | "edit" | "select";

type TaskPlannerModeControlsProps = {
    mode: PlannerMode;
    onModeChange: (mode: PlannerMode) => void;
};

export function TaskPlannerModeControls({
                                            mode,
                                            onModeChange,
                                        }: TaskPlannerModeControlsProps) {
    return (
        <div className="task-planner-mode-controls" role="tablist" aria-label="Task planner mode">
            <button
                className={mode === "view" ? "active" : undefined}
                type="button"
                role="tab"
                aria-selected={mode === "view"}
                onClick={() => onModeChange("view")}
            >
                View
            </button>
            <button
                className={mode === "edit" ? "active" : undefined}
                type="button"
                role="tab"
                aria-selected={mode === "edit"}
                onClick={() => onModeChange("edit")}
            >
                Edit
            </button>
            <button
                className={mode === "select" ? "active" : undefined}
                type="button"
                role="tab"
                aria-selected={mode === "select"}
                onClick={() => onModeChange("select")}
            >
                Select
            </button>
        </div>
    );
}
