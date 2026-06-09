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
    <section className="task-list" aria-label="All tasks">
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
