import { useMemo, useState } from "react";
import type { Task, TaskStatus } from "@/src/types/task.ts";
import { useTaskSelectionState } from "@/src/states/taskSelectionState.ts";
import { TaskDetailsView } from "./TaskDetailsView.tsx";
import { TaskPlannerView } from "./TaskPlannerView.tsx";
import { cn } from "@/lib/utils.ts";

type RightPanelTab = "details" | "planner";

type RightPanelProps = {
  tasks: Task[];
  onAddTask: (
    title: string,
    description: string,
    status: TaskStatus,
  ) => Promise<Task>;
  onUpdateTask: (task: {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
  }) => Promise<Task | null>;
};

export function RightPanel({ tasks, onAddTask, onUpdateTask }: RightPanelProps) {
  const [activeTab, setActiveTab] = useState<RightPanelTab>("details");
  const selectedTaskId = useTaskSelectionState((state) => state.selectedTaskId);
  const selectTask = useTaskSelectionState((state) => state.selectTask);
  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [selectedTaskId, tasks],
  );

  return (
    <section className="detail-panel" aria-label="Task workspace">
      <header className="right-panel-header">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>{activeTab === "details" ? "Details" : "Task Planner"}</h1>
        </div>
        <div className="right-panel-tabs" role="tablist" aria-label="Workspace tabs">
          <button
            className={cn("right-panel-tab", activeTab === "details" && "active")}
            type="button"
            role="tab"
            aria-selected={activeTab === "details"}
            onClick={() => setActiveTab("details")}
          >
            Details
          </button>
          <button
            className={cn("right-panel-tab", activeTab === "planner" && "active")}
            type="button"
            role="tab"
            aria-selected={activeTab === "planner"}
            onClick={() => setActiveTab("planner")}
          >
            Task Planner
          </button>
        </div>
      </header>

      {activeTab === "details" ? (
        <TaskDetailsView task={selectedTask} onUpdateTask={onUpdateTask} />
      ) : (
        <TaskPlannerView
          tasks={tasks}
          onAddTask={onAddTask}
          onRequestTaskDetails={(taskId) => {
            selectTask(taskId);
            setActiveTab("details");
          }}
        />
      )}
    </section>
  );
}
