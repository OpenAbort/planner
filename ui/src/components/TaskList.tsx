import { TaskItem } from "./TaskItem";
import type { Task } from "../types/task";

type TaskListProps = {
  tasks: Task[];
  onToggleTask: (taskId: number) => void;
  onRemoveTask: (taskId: number) => void;
};

export function TaskList({
  tasks,
  onToggleTask,
  onRemoveTask,
}: TaskListProps) {
  return (
    <section
      className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-0.5 [scrollbar-color:#cbd5e1_transparent] [scrollbar-width:thin]
      [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-track]:bg-transparent"
      aria-label="All tasks"
    >
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggleTask={onToggleTask}
          onRemoveTask={onRemoveTask}
        />
      ))}
    </section>
  );
}
