import type { FormEventHandler } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";
import type { TaskStatus } from "../../../types/task.ts";
import { taskStatusOptions } from "../taskStatus.tsx";

type AddTaskDialogProps = {
  taskTitle: string;
  taskStatus: TaskStatus;
  onClose: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onTaskStatusChange: (status: TaskStatus) => void;
  onTaskTitleChange: (title: string) => void;
};

export function AddTaskDialog({
  taskTitle,
  taskStatus,
  onClose,
  onSubmit,
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
        className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
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
            className="min-h-9 w-full min-w-0 rounded-lg border border-[#ccd6e3] bg-white px-3 py-1.5 text-[#172033] outline-none focus:border-black focus:shadow-[0_0_0_2px_rgba(0,0,0,0.14)]"
            aria-label="New task title"
            autoFocus
            value={taskTitle}
            onChange={(event) => onTaskTitleChange(event.currentTarget.value)}
            placeholder="Add a task..."
          />
        </label>

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
