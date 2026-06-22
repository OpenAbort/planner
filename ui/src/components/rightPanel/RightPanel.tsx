import { useMemo, useState } from "react";
import type { Task, TaskStatus } from "@/src/types/task.ts";
import { useTaskSelectionState } from "@/src/states/taskSelectionState.ts";
import { TaskDetailsView } from "./TaskDetailsView.tsx";
import { TaskPlannerView } from "./TaskPlannerView.tsx";
import { TimelineView } from "./timeline/TimelineView.tsx";
import { cn } from "@/lib/utils.ts";

type RightPanelTab = "details" | "planner" | "timeline";

type RightPanelProps = {
  tasks: Task[];
  onAddTask: (
    title: string,
    description: string,
    status: TaskStatus,
    startDate: string | null,
    dueDate: string | null,
  ) => Promise<Task>;
  onUpdateTask: (task: {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    startDate: string | null;
    dueDate: string | null;
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
  const titleByTab: Record<RightPanelTab, string> = {
    details: "Details",
    planner: "Task Planner",
    timeline: "Timeline View",
  };

  return (
    <section className="detail-panel" aria-label="Task workspace">
      <header className="right-panel-header">
        <div>
          <p className="eyebrow">Workspace</p>
          <h1>{titleByTab[activeTab]}</h1>
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
          <button
            className={cn("right-panel-tab", activeTab === "timeline" && "active")}
            type="button"
            role="tab"
            aria-selected={activeTab === "timeline"}
            onClick={() => setActiveTab("timeline")}
          >
            Timeline View
          </button>
        </div>
      </header>

      {activeTab === "details" && (
        <TaskDetailsView task={selectedTask} onUpdateTask={onUpdateTask} />
      )}
      {activeTab === "planner" && (
        <TaskPlannerView
          tasks={tasks}
          selectedTaskId={selectedTaskId}
          onAddTask={onAddTask}
          onUpdateTask={onUpdateTask}
          onRequestTaskDetails={(taskId) => {
            selectTask(taskId);
            setActiveTab("details");
          }}
        />
      )}
      {activeTab === "timeline" && <TimelineView tasks={tasks} onUpdateTask={onUpdateTask} />}
    </section>
  );
}
