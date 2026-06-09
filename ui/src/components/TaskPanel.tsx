import { TaskForm } from "./TaskForm";
import { TaskList } from "./TaskList";
import type { Task } from "../types/task";

type TaskPanelProps = {
  tasks: Task[];
  remainingTasks: number;
  onAddTask: (title: string) => void;
  onToggleTask: (taskId: number) => void;
  onRemoveTask: (taskId: number) => void;
};

export function TaskPanel({
  tasks,
  remainingTasks,
  onAddTask,
  onToggleTask,
  onRemoveTask,
}: TaskPanelProps) {
  return (
    <aside className="task-panel" aria-label="Task list">
      <header className="panel-header">
        <div>
          <p className="eyebrow">Planner</p>
          <h1>Tasks</h1>
        </div>
        <span className="task-count">{remainingTasks} open</span>
      </header>

      <TaskForm onAddTask={onAddTask} />
      <TaskList
        tasks={tasks}
        onToggleTask={onToggleTask}
        onRemoveTask={onRemoveTask}
      />
    </aside>
  );
}
