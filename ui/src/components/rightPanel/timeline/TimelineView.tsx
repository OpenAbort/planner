import { useMemo } from "react";
import type { Task, TaskStatus } from "@/src/types/task.ts";
import { useTaskPrerequisites } from "@/src/hooks/useTaskPrerequisites.ts";
import { TimelineCanvas } from "./TimelineCanvas.tsx";
import { createTimelineLayout } from "./timelineLayout.ts";
import { useTimelineNow } from "./useTimelineNow.ts";

type TimelineViewProps = {
  tasks: Task[];
  selectedTaskId: string | null;
  onUpdateTask: (task: {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    startDate: string | null;
    dueDate: string | null;
  }) => Promise<Task | null>;
};

export function TimelineView({ tasks, selectedTaskId, onUpdateTask }: TimelineViewProps) {
  const now = useTimelineNow();
  const taskIds = useMemo(() => tasks.map((task) => task.id), [tasks]);
  const { visiblePrerequisiteLinks } = useTaskPrerequisites({ taskIds });
  const layout = useMemo(
    () => createTimelineLayout(tasks, visiblePrerequisiteLinks, now.getTime()),
    [now, tasks, visiblePrerequisiteLinks],
  );
  const scheduledCount = tasks.filter((task) => task.dueDate).length;
  const conflictCount = layout.tasks.filter((entry) => entry.conflictTitles.length > 0).length;

  if (tasks.length === 0) {
    return (
      <div className="right-panel-empty">
        <h2>No tasks yet</h2>
        <p>Add tasks from the left panel to build a timeline.</p>
      </div>
    );
  }

  return (
    <div className="timeline-view">
      <div className="timeline-summary">
        <span>{scheduledCount} scheduled</span>
        <span>{tasks.length - scheduledCount} unscheduled</span>
        {conflictCount > 0 && <span className="conflict">{conflictCount} conflicts</span>}
      </div>
      <TimelineCanvas
        layout={layout}
        tasks={tasks}
        selectedTaskId={selectedTaskId}
        prerequisiteLinks={visiblePrerequisiteLinks}
        onUpdateTask={onUpdateTask}
      />
    </div>
  );
}
