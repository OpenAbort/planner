import { Minus, Plus, RotateCcw } from "lucide-react";

type TaskPlannerZoomControlsProps = {
    canZoomIn: boolean;
    canZoomOut: boolean;
    zoom: number;
    onResetZoom: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
};

export function TaskPlannerZoomControls({
                                            canZoomIn,
                                            canZoomOut,
                                            zoom,
                                            onResetZoom,
                                            onZoomIn,
                                            onZoomOut,
                                        }: TaskPlannerZoomControlsProps) {
    return (
        <div className="task-planner-zoom-controls" aria-label="Task planner zoom controls">
            <button
                type="button"
                aria-label="Zoom out"
                title="Zoom out"
                disabled={!canZoomOut}
                onClick={onZoomOut}
            >
                <Minus className="size-4"/>
            </button>
            <span>{Math.round(zoom * 100)}%</span>
            <button
                type="button"
                aria-label="Zoom in"
                title="Zoom in"
                disabled={!canZoomIn}
                onClick={onZoomIn}
            >
                <Plus className="size-4"/>
            </button>
            <button
                type="button"
                aria-label="Reset zoom"
                title="Reset zoom"
                onClick={onResetZoom}
            >
                <RotateCcw className="size-4"/>
            </button>
        </div>
    );
}
