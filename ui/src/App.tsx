import { useMemo, useState } from "react";
import { DetailPanel } from "./components/DetailPanel";
import { TaskPanel } from "./components/TaskPanel";
import type { Task } from "./types/task";
import "./App.css";

const initialTasks: Task[] = [
  { id: 1, title: "Review project brief", done: false },
  { id: 2, title: "Sketch planner workflow", done: true },
  { id: 3, title: "Prepare task data model", done: false },
  { id: 4, title: "Prepare task data model", done: false },
  { id: 5, title: "Prepare task data model", done: false },
  { id: 6, title: "Prepare task data model", done: false },
  { id: 7, title: "Prepare task data model", done: false },
  { id: 8, title: "Prepare task data model", done: false },
  { id: 9, title: "Prepare task data model", done: false },
  { id: 10, title: "Prepare task data model", done: false },
];

function App() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const remainingTasks = useMemo(
    () => tasks.filter((task) => !task.done).length,
    [tasks],
  );

  function addTask(title: string) {
    setTasks((currentTasks) => [
      { id: Date.now(), title, done: false },
      ...currentTasks,
    ]);
  }

  function toggleTask(taskId: number) {
    setTasks((currentTasks) =>
      currentTasks.map((task) =>
        task.id === taskId ? { ...task, done: !task.done } : task,
      ),
    );
  }

  function removeTask(taskId: number) {
    setTasks((currentTasks) =>
      currentTasks.filter((task) => task.id !== taskId),
    );
  }

  return (
    <main className="app-shell">
      <TaskPanel
        tasks={tasks}
        remainingTasks={remainingTasks}
        onAddTask={addTask}
        onToggleTask={toggleTask}
        onRemoveTask={removeTask}
      />
      <DetailPanel />
    </main>
  );
}

export default App;
