import { Save, Trash2, X } from "lucide-react";
import type { FormEvent } from "react";
import type { NodePosition, PlannerLink } from "./states/taskPlannerState.ts";

type TaskPlannerLinkContextMenuProps = {
    labelDraft: string;
    link: PlannerLink;
    position: NodePosition;
    onClose: () => void;
    onDelete: () => void;
    onLabelDraftChange: (label: string) => void;
    onSaveLabel: () => void;
};

export function TaskPlannerLinkContextMenu({
                                               labelDraft,
                                               link,
                                               position,
                                               onClose,
                                               onDelete,
                                               onLabelDraftChange,
                                               onSaveLabel,
                                           }: TaskPlannerLinkContextMenuProps) {
    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        onSaveLabel();
    }

    return (
        <form
            className="task-planner-context-menu task-planner-link-menu"
            style={{
                left: position.x,
                top: position.y,
            }}
            aria-label="Connection actions"
            onSubmit={handleSubmit}
            onPointerDown={(event) => event.stopPropagation()}
        >
            <label className="task-planner-link-label-field">
                <span>Connection label</span>
                <input
                    value={labelDraft}
                    aria-label={`Label for connection from ${link.prerequisiteTaskId} to ${link.taskId}`}
                    autoFocus
                    onChange={(event) => onLabelDraftChange(event.target.value)}
                />
            </label>
            <div className="task-planner-link-menu-actions">
                <button className="task-planner-context-menu-item" type="submit">
                    <Save className="size-4"/>
                    Save label
                </button>
                <button
                    className="task-planner-context-menu-item danger"
                    type="button"
                    onClick={onDelete}
                >
                    <Trash2 className="size-4"/>
                    Delete connection
                </button>
                <button
                    className="task-planner-context-menu-item"
                    type="button"
                    onClick={onClose}
                >
                    <X className="size-4"/>
                    Close
                </button>
            </div>
        </form>
    );
}
