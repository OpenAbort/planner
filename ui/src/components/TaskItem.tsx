import type { Task } from "../types/task";

type TaskItemProps = {
  task: Task;
  onToggleTask: (taskId: number) => void;
  onRemoveTask: (taskId: number) => void;
};

export function TaskItem({
  task,
  onToggleTask,
  onRemoveTask,
}: TaskItemProps) {
  return (
    <article className={`task-item${task.done ? " task-item-done" : ""}`}>
      <button
        className="task-check"
        type="button"
        aria-label={task.done ? "Mark task open" : "Mark task done"}
        aria-pressed={task.done}
        onClick={() => onToggleTask(task.id)}
      />
      <span>{task.title}</span>
      <button
        className="task-delete"
        type="button"
        aria-label={`Delete ${task.title}`}
        onClick={() => onRemoveTask(task.id)}
      >
        x
      </button>
    </article>
  );
}
