import { useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { DateAndTimePicker } from "@/src/components/common/DateAndTimePicker.tsx";
import { taskStatusOptions } from "@/src/components/common/taskStatus.tsx";
import type { Task, TaskStatus } from "@/src/types/task.ts";

type TimelineTaskContextMenuProps = {
  position: {
    x: number;
    y: number;
  };
  task: Task;
  onUpdateTask: (task: {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    startDate: string | null;
    dueDate: string | null;
  }) => Promise<Task | null>;
};

export function TimelineTaskContextMenu({
  position,
  task,
  onUpdateTask,
}: TimelineTaskContextMenuProps) {
  const [startDate, setStartDate] = useState(task.startDate ?? "");
  const [dueDate, setDueDate] = useState(task.dueDate ?? "");
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"menu" | "dates" | "status">("menu");

  useEffect(() => {
    setStartDate(task.startDate ?? "");
    setDueDate(task.dueDate ?? "");
    setError(null);
    setView("menu");
  }, [task]);

  async function updateTask(next: {
    status?: TaskStatus;
    startDate?: string;
    dueDate?: string;
  }) {
    const nextStartDate = next.startDate ?? startDate;
    const nextDueDate = next.dueDate ?? dueDate;

    if (nextStartDate && nextDueDate && nextDueDate < nextStartDate) {
      setError("Due date must be on or after start date.");
      return;
    }

    setError(null);
    await onUpdateTask({
      ...task,
      status: next.status ?? task.status,
      startDate: nextStartDate || null,
      dueDate: nextDueDate || null,
    });
  }

  return (
    <div
      className="task-planner-context-menu timeline-task-context-menu"
      style={{ left: position.x, top: position.y }}
      role="menu"
      aria-label={`${task.title} timeline actions`}
      onContextMenu={(event) => event.preventDefault()}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {view === "menu" && (
        <>
          <button
            className="task-planner-context-menu-item"
            type="button"
            role="menuitem"
            onClick={() => setView("dates")}
          >
            <CalendarClock className="size-4" />
            Edit start / due time
          </button>
          <button
            className="task-planner-context-menu-item"
            type="button"
            role="menuitem"
            onClick={() => setView("status")}
          >
            <CheckCircle2 className="size-4" />
            Update status
          </button>
        </>
      )}
      {view !== "menu" && (
        <button
          className="task-planner-context-menu-item"
          type="button"
          onClick={() => {
            setError(null);
            setView("menu");
          }}
        >
          <ChevronLeft className="size-4" />
          Back
        </button>
      )}
      {view === "dates" && (
        <>
          <DateAndTimePicker
            id={`timeline-${task.id}-start`}
            label="Start time"
            value={startDate}
            onChange={(value) => {
              setStartDate(value);
              updateTask({ startDate: value }).catch(console.error);
            }}
          />
          <DateAndTimePicker
            id={`timeline-${task.id}-due`}
            label="Due time"
            value={dueDate}
            onChange={(value) => {
              setDueDate(value);
              updateTask({ dueDate: value }).catch(console.error);
            }}
          />
        </>
      )}
      {view === "status" && (
        <fieldset className="timeline-task-context-status">
          <legend>Status</legend>
          {taskStatusOptions.map((option) => {
            const Icon = option.icon;

            return (
              <button
                className={cn("task-planner-context-menu-item", option.optionClassName)}
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={task.status === option.value}
                onClick={() => updateTask({ status: option.value }).catch(console.error)}
              >
                <Icon className="size-4" />
                {option.label}
              </button>
            );
          })}
        </fieldset>
      )}
      {error && <p className="timeline-task-context-error">{error}</p>}
    </div>
  );
}
