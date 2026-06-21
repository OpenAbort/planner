import { getTaskStatusOption } from "@/src/components/common/taskStatus.tsx";
import type { Task } from "@/src/types/task.ts";
import type { NodePosition, PlannerLink } from "./states/taskPlannerState.ts";

type TaskPlannerTaskCardProps = {
    position: NodePosition;
    prerequisiteLinks: PlannerLink[];
    tasks: Task[];
    task: Task;
    onClose: () => void;
};

export function TaskPlannerTaskCard({
                                        position,
                                        prerequisiteLinks,
                                        tasks,
                                        task,
                                        onClose,
                                    }: TaskPlannerTaskCardProps) {
    const statusOption = getTaskStatusOption(task.status);
    const StatusIcon = statusOption.icon;
    const prerequisites = prerequisiteLinks
        .filter((link) => link.taskId === task.id)
        .map((link) => tasks.find((candidate) => candidate.id === link.prerequisiteTaskId))
        .filter((candidate): candidate is Task => Boolean(candidate));

    return (
        <section
            className="task-planner-task-card"
            style={{
                left: position.x,
                top: position.y,
            }}
            aria-label={`${task.title} summary`}
            onClick={(event) => event.stopPropagation()}
            onPointerDown={(event) => event.stopPropagation()}
        >
            <div className="task-planner-task-card-header">
                <div>
                    <p>Task</p>
                    <h2>{task.title}</h2>
                </div>
                <button type="button" aria-label="Close task summary" onClick={onClose}>
                    x
                </button>
            </div>
            <div className={`task-planner-task-card-status ${statusOption.badgeClassName}`}>
                <StatusIcon className="size-3.5"/>
                {statusOption.label}
            </div>
            <p className="task-planner-task-card-description">
                {task.description.trim() || "No description."}
            </p>
            <div className="task-planner-task-card-section">
                <h3>Prerequisites</h3>
                {prerequisites.length > 0 ? (
                    <div className="task-planner-task-card-prerequisites">
                        {prerequisites.map((prerequisite) => {
                            const prerequisiteStatus = getTaskStatusOption(prerequisite.status);
                            const PrerequisiteStatusIcon = prerequisiteStatus.icon;

                            return (
                                <div className="task-planner-task-card-prerequisite" key={prerequisite.id}>
                                    <span>{prerequisite.title}</span>
                                    <span className={prerequisiteStatus.badgeClassName}>
                                        <PrerequisiteStatusIcon className="size-3"/>
                                        {prerequisiteStatus.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="task-planner-task-card-empty">No prerequisites.</p>
                )}
            </div>
        </section>
    );
}
