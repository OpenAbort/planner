import { FormEvent, useEffect, useMemo, useState } from "react";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { taskStatusOptions } from "@/src/components/common/taskStatus.tsx";
import type { Task, TaskStatus } from "@/src/types/task.ts";
import { cn } from "@/lib/utils.ts";

type TaskDetailsViewProps = {
  task: Task | null;
  onUpdateTask: (task: {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
  }) => Promise<Task | null>;
};

export function TaskDetailsView({ task, onUpdateTask }: TaskDetailsViewProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("OPEN");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTitle(task?.title ?? "");
    setDescription(task?.description ?? "");
    setStatus(task?.status ?? "OPEN");
    setError(null);
  }, [task]);

  const isDirty = useMemo(
    () =>
      Boolean(task) &&
      (title !== task?.title ||
        description !== task?.description ||
        status !== task?.status),
    [description, status, task, title],
  );

  if (!task) {
    return (
      <div className="right-panel-empty">
        <h2>Select a task</h2>
        <p>Choose a task from the left panel to view and edit its details.</p>
      </div>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!task) {
      return;
    }

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      setError("Title is required.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      await onUpdateTask({
        id: task.id,
        title: trimmedTitle,
        description: description.trim(),
        status,
      });
    } catch (e) {
      setError(String(e));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className="task-details-form" onSubmit={handleSubmit}>
      <label className="task-details-field">
        <span>Title</span>
        <input
          className="task-details-input"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </label>

      <label className="task-details-field">
        <span>Description</span>
        <textarea
          className="task-details-textarea"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </label>

      <fieldset className="task-details-field">
        <legend>Status</legend>
        <div className="status-option-grid">
          {taskStatusOptions.map((option) => {
            const StatusIcon = option.icon;
            return (
              <button
                key={option.value}
                className={cn(
                  "status-option-button",
                  option.optionClassName,
                  status === option.value && "selected",
                )}
                type="button"
                data-selected={status === option.value}
                onClick={() => setStatus(option.value)}
              >
                <StatusIcon className="size-4" />
                {option.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      {error && <p className="task-details-error">{error}</p>}

      <div className="task-details-actions">
        <Button
          className="gap-2 rounded-lg bg-primary px-4 font-bold text-white hover:bg-primary/80 disabled:pointer-events-none disabled:opacity-45"
          type="submit"
          disabled={!title.trim() || !isDirty || isSaving}
        >
          <Save className="size-4" />
          {isSaving ? "Saving" : "Save"}
        </Button>
      </div>
    </form>
  );
}
