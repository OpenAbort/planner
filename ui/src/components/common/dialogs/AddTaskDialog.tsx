import type { FormEventHandler } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";
import type { TaskStatus } from "../../../types/task.ts";
import { taskStatusOptions } from "../taskStatus.tsx";
import { DateAndTimePicker } from "@/src/components/common/DateAndTimePicker.tsx";

type AddTaskDialogProps = {
  taskTitle: string;
  taskDescription: string;
  taskDueDate: string;
  taskStartDate: string;
  taskStatus: TaskStatus;
  formError?: string | null;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onTaskDescriptionChange: (description: string) => void;
  onTaskDueDateChange: (dueDate: string) => void;
  onTaskStartDateChange: (startDate: string) => void;
  onTaskStatusChange: (status: TaskStatus) => void;
  onTaskTitleChange: (title: string) => void;
};

export function AddTaskDialog({
  taskTitle,
  taskDescription,
  taskDueDate,
  taskStartDate,
  taskStatus,
  formError,
  onClose,
  onSubmit,
  onTaskDescriptionChange,
  onTaskDueDateChange,
  onTaskStartDateChange,
  onTaskStatusChange,
  onTaskTitleChange,
}: AddTaskDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <form
        className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
        aria-label="Add task"
        onSubmit={onSubmit}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="m-0 text-base font-semibold text-slate-950">
            Add task
          </h2>
          <Button
            className="size-8 rounded-lg p-0 text-slate-500 hover:bg-slate-100"
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close add task dialog"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>

        <label className="mb-3 block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
            Title
          </span>
          <input
            className="black-focus min-h-9 w-full min-w-0 rounded-lg border border-[#ccd6e3] bg-white px-3 py-1.5 text-[#172033] outline-none"
            aria-label="New task title"
            autoFocus
            value={taskTitle}
            onChange={(event) => onTaskTitleChange(event.currentTarget.value)}
            placeholder="Add a task..."
          />
        </label>

        <label className="mb-3 block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
            Description
          </span>
          <textarea
            className="black-focus min-h-20 w-full min-w-0 resize-none rounded-lg border border-[#ccd6e3] bg-white px-3 py-2 text-[#172033] outline-none"
            aria-label="New task description"
            value={taskDescription}
            onChange={(event) => onTaskDescriptionChange(event.currentTarget.value)}
            placeholder="Add details..."
          />
        </label>

        <div className="task-date-picker-grid mb-3">
          <DateAndTimePicker
            id="new-task-start-date"
            label="Start time"
            value={taskStartDate}
            onChange={onTaskStartDateChange}
          />
          <DateAndTimePicker
            id="new-task-due-date"
            label="Due time"
            value={taskDueDate}
            onChange={onTaskDueDateChange}
          />
        </div>

        <fieldset className="mb-4 grid gap-2 border-0 p-0">
          <legend className="mb-1.5 text-xs font-semibold text-slate-600">
            Status
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {taskStatusOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = taskStatus === option.value;

              return (
                <button
                  className={cn(
                    "flex min-h-9 items-center gap-2 rounded-lg border bg-white px-2.5 py-1.5 text-left text-xs font-semibold transition-colors hover:bg-slate-50",
                    option.optionClassName
                  )}
                  data-selected={isSelected}
                  key={option.value}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => onTaskStatusChange(option.value)}
                >
                  <Icon className="size-4 shrink-0" />
                  <span className="min-w-0 truncate">{option.label}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {formError && (
          <p className="mb-3 mt-0 text-sm font-semibold text-red-600">{formError}</p>
        )}

        <Button
          className="h-9 w-full rounded-lg bg-primary px-3.5 font-bold text-white hover:bg-primary/70"
          type="submit"
        >
          Add
        </Button>
      </form>
    </div>
  );
}
