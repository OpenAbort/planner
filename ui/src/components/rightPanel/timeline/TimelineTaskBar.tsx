import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { getTaskStatusOption } from "@/src/components/common/taskStatus.tsx";
import type { TimelineTask } from "./timelineLayout.ts";

type TimelineTaskBarProps = {
  entry: TimelineTask;
};

export function TimelineTaskBar({ entry }: TimelineTaskBarProps) {
  const statusOption = getTaskStatusOption(entry.task.status);
  const hasConflict = entry.conflictTitles.length > 0;
  const title = hasConflict
    ? `Scheduled before prerequisite completion: ${entry.conflictTitles.join(", ")}`
    : entry.task.title;

  return (
    <div
      className={cn(
        "timeline-task-bar",
        entry.isMilestone && "milestone",
        entry.isUnscheduled && "unscheduled",
        hasConflict && "conflict",
      )}
      style={{
        left: entry.left,
        top: entry.top,
        width: entry.width,
      }}
      title={title}
    >
      <span className={cn("timeline-task-status-dot", statusOption.badgeClassName)} />
      <span className="timeline-task-title">{entry.task.title}</span>
      {hasConflict && <AlertTriangle className="timeline-conflict-icon" aria-hidden="true" />}
    </div>
  );
}
