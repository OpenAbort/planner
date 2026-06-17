import { useMemo, useState } from "react";
import { Group, Panel, Separator } from "react-resizable-panels";
import { DetailPanel } from "./components/DetailPanel";
import { TaskPanel } from "./components/leftPanel/TaskPanel.tsx";
import type { Task, TaskStatus } from "./types/task";
import "./App.css";
import {invoke} from "@tauri-apps/api/core";

const initialTasks: Task[] = [
  { id: 1, title: "Review project brief", done: false, status: "OPEN" },
  { id: 2, title: "Sketch planner workflow", done: true, status: "IMPLEMENTED" },
  { id: 3, title: "Prepare task data model", done: false, status: "IN PROGRESS" },
  { id: 4, title: "Prepare task data model", done: false, status: "OPEN" },
  { id: 5, title: "Prepare task data model", done: false, status: "OPEN" },
  { id: 6, title: "Prepare task data model", done: false, status: "OPEN" },
  { id: 7, title: "Prepare task data model", done: false, status: "OPEN" },
  { id: 8, title: "Prepare task data model", done: false, status: "OPEN" },
  { id: 9, title: "Prepare task data model", done: false, status: "OPEN" },
  { id: 10, title: "Prepare task data model", done: false, status: "CLOSE" },
];

function App() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const remainingTasks = useMemo(
    () => tasks.filter((task) => !task.done).length,
    [tasks],
  );

  async function addTask(title: string, status: TaskStatus) {
    setTasks((currentTasks) => [
      { id: Date.now(), title, done: status === "IMPLEMENTED" || status === "CLOSE", status },
      ...currentTasks,
    ]);

      const result = await invoke("add_todo", {
          title,
      });

      console.log(result);
  }

  function removeTasks(taskIds: number[]) {
    const taskIdSet = new Set(taskIds);

    setTasks((currentTasks) =>
      currentTasks.filter((task) => !taskIdSet.has(task.id)),
    );
  }

  function reorderTask(sourceTaskId: number, targetTaskId: number) {
    setTasks((currentTasks) => {
      const sourceIndex = currentTasks.findIndex((task) => task.id === sourceTaskId);
      const targetIndex = currentTasks.findIndex((task) => task.id === targetTaskId);

      if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
        return currentTasks;
      }

      const nextTasks = [...currentTasks];
      const [movedTask] = nextTasks.splice(sourceIndex, 1);
      nextTasks.splice(targetIndex, 0, movedTask);

      return nextTasks;
    });
  }

  return (
    <Group className="app-shell" orientation="horizontal" role="main">
      <Panel defaultSize="360px" minSize="280px" maxSize="520px">
        <TaskPanel
          tasks={tasks}
          remainingTasks={remainingTasks}
          onAddTask={addTask}
          onRemoveTasks={removeTasks}
          onReorderTask={reorderTask}
        />
      </Panel>
      <Separator className="panel-resize-handle" aria-label="Resize task panel" />
      <Panel minSize="360px">
        <DetailPanel />
      </Panel>
    </Group>
  );
}

export default App;
