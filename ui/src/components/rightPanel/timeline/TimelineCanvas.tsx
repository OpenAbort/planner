import { useEffect, useState } from "react";
import { TimelineAxis } from "./TimelineAxis.tsx";
import { TimelineTaskContextMenu } from "./TimelineTaskContextMenu.tsx";
import { TimelineTaskBar } from "./TimelineTaskBar.tsx";
import type { MouseEvent } from "react";
import type { Task, TaskPrerequisiteLink, TaskStatus } from "@/src/types/task.ts";
import type { TimelineLayout } from "./timelineLayout.ts";

type TimelineCanvasProps = {
  layout: TimelineLayout;
  tasks: Task[];
  prerequisiteLinks: TaskPrerequisiteLink[];
  onUpdateTask: (task: {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    startDate: string | null;
    dueDate: string | null;
  }) => Promise<Task | null>;
};

type TimelineContextMenu = {
  position: {
    x: number;
    y: number;
  };
  task: Task;
};

export function TimelineCanvas({ layout, tasks, prerequisiteLinks, onUpdateTask }: TimelineCanvasProps) {
  const [contextMenu, setContextMenu] = useState<TimelineContextMenu | null>(null);

  useEffect(() => {
    if (!contextMenu) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setContextMenu(null);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [contextMenu]);

  function handleTaskContextMenu(event: MouseEvent<HTMLElement>, task: Task) {
    event.preventDefault();
    event.stopPropagation();

    const rect = event.currentTarget.offsetParent?.getBoundingClientRect();

    setContextMenu({
      position: {
        x: event.clientX - (rect?.left ?? 0),
        y: event.clientY - (rect?.top ?? 0),
      },
      task,
    });
  }

  return (
    <div
      className="timeline-canvas"
      role="img"
      aria-label="Task schedule timeline"
      onPointerDown={() => setContextMenu(null)}
    >
      <div
        className="timeline-content"
        style={{
          width: layout.width,
          height: layout.height,
        }}
      >
        <div
          className="timeline-past-region"
          style={{
            width: Math.max(0, layout.nowLeft),
          }}
        />
        <div
          className="timeline-future-region"
          style={{
            left: layout.nowLeft,
            width: Math.max(0, layout.width - layout.nowLeft),
          }}
        />
        {layout.riskOverlay && (
          <div
            className="timeline-risk-region"
            style={{
              left: layout.riskOverlay.left,
              width: layout.riskOverlay.width,
            }}
          />
        )}
        <TimelineAxis layout={layout} />
        <div
          className="timeline-now-line"
          style={{
            left: layout.nowLeft,
          }}
        >
          <span>Now</span>
        </div>
        {layout.unscheduledBottom !== null && (
          <>
            <div
              className="timeline-unscheduled-rule"
              style={{ bottom: layout.unscheduledBottom }}
            />
            <div
              className="timeline-unscheduled-label"
              style={{ bottom: layout.unscheduledBottom + 4 }}
            >
              Unscheduled
            </div>
          </>
        )}
        {layout.tasks.map((entry) => (
          <TimelineTaskBar
            key={entry.task.id}
            entry={entry}
            tasks={tasks}
            prerequisiteLinks={prerequisiteLinks}
            onTaskContextMenu={handleTaskContextMenu}
          />
        ))}
        {contextMenu && (
          <TimelineTaskContextMenu
            position={contextMenu.position}
            task={contextMenu.task}
            onUpdateTask={onUpdateTask}
          />
        )}
      </div>
    </div>
  );
}
