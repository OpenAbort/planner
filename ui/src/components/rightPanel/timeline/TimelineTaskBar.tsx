import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { getTaskStatusOption } from "@/src/components/common/taskStatus.tsx";
import { TaskPlannerTaskCard } from "@/src/components/rightPanel/TaskPlannerTaskCard.tsx";
import type { Task, TaskPrerequisiteLink } from "@/src/types/task.ts";
import type { TimelineTask } from "./timelineLayout.ts";

type TimelineTaskBarProps = {
  entry: TimelineTask;
  tasks: Task[];
  prerequisiteLinks: TaskPrerequisiteLink[];
};

export function TimelineTaskBar({entry, tasks, prerequisiteLinks}: TimelineTaskBarProps) {
  const statusOption = getTaskStatusOption(entry.task.status);
  const hasConflict = entry.conflictTitles.length > 0;
  const isCompact = entry.width < 96;

  return (
    <div
      className={cn(
        "timeline-task-bar",
        entry.isMilestone && "milestone",
        entry.isUnscheduled && "unscheduled",
        isCompact && "compact",
        hasConflict && "conflict",
      )}
      style={{
        left: entry.left,
        top: entry.top,
        bottom: entry.bottom,
        width: entry.width,
      }}
      tabIndex={0}
      aria-label={entry.task.title}
    >
      <span
        className={cn("timeline-task-status-dot", statusOption.badgeClassName)}
        data-status={entry.task.status}
      />
      <span className="timeline-task-title">{entry.task.title}</span>
      {hasConflict && <AlertTriangle className="timeline-conflict-icon" aria-hidden="true"/>}
      <div className="timeline-task-tooltip" role="tooltip">
        {hasConflict && (
          <p className="timeline-task-tooltip-conflict">
            Scheduled before prerequisite completion: {entry.conflictTitles.join(", ")}
          </p>
        )}
        <TaskPlannerTaskCard
          task={entry.task}
          tasks={tasks}
          prerequisiteLinks={prerequisiteLinks}
        />
      </div>
    </div>
  );
}
