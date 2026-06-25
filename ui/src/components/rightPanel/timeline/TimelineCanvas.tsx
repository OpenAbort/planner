import { useEffect, useRef, useState } from "react";
import { TimelineAxis } from "./TimelineAxis.tsx";
import { TimelineTaskContextMenu } from "./TimelineTaskContextMenu.tsx";
import { TimelineTaskBar } from "./TimelineTaskBar.tsx";
import type { MouseEvent } from "react";
import type { Task, TaskPrerequisiteLink, TaskStatus } from "@/src/types/task.ts";
import type { TimelineLayout } from "./timelineLayout.ts";

// Matches the rendered height of `.timeline-task-bar` in App.css.
const TASK_BAR_HEIGHT = 30;
const SCROLL_INTO_VIEW_PADDING = 32;

type TimelineCanvasProps = {
  layout: TimelineLayout;
  tasks: Task[];
  selectedTaskId: string | null;
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

export function TimelineCanvas({ layout, tasks, selectedTaskId, prerequisiteLinks, onUpdateTask }: TimelineCanvasProps) {
  const [contextMenu, setContextMenu] = useState<TimelineContextMenu | null>(null);
  const canvasRef = useRef<HTMLDivElement | null>(null);
  // Latest layout, read inside the scroll effect without re-running it on every
  // `now` tick (the layout recomputes periodically).
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

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

  // Bring the task selected in the left panel into view, mirroring the planner.
  // Runs only when the selection changes (not on layout/now ticks) so it never
  // yanks back a view the user has manually scrolled.
  useEffect(() => {
    if (!selectedTaskId) {
      return;
    }

    const canvas = canvasRef.current;
    const entry = layoutRef.current.tasks.find((item) => item.task.id === selectedTaskId);

    if (!canvas || !entry) {
      return;
    }

    const barTop = entry.top ?? layoutRef.current.height - (entry.bottom ?? 0) - TASK_BAR_HEIGHT;
    const barLeft = entry.left;
    const barRight = barLeft + entry.width;
    const barBottom = barTop + TASK_BAR_HEIGHT;
    const viewLeft = canvas.scrollLeft;
    const viewTop = canvas.scrollTop;
    const viewRight = viewLeft + canvas.clientWidth;
    const viewBottom = viewTop + canvas.clientHeight;
    const isVisible =
      barLeft >= viewLeft + SCROLL_INTO_VIEW_PADDING &&
      barTop >= viewTop + SCROLL_INTO_VIEW_PADDING &&
      barRight <= viewRight - SCROLL_INTO_VIEW_PADDING &&
      barBottom <= viewBottom - SCROLL_INTO_VIEW_PADDING;

    if (isVisible) {
      return;
    }

    const nextLeft = barLeft + entry.width / 2 - canvas.clientWidth / 2;
    const nextTop = barTop + TASK_BAR_HEIGHT / 2 - canvas.clientHeight / 2;

    requestAnimationFrame(() => {
      canvas.scrollTo({
        left: Math.max(0, nextLeft),
        top: Math.max(0, nextTop),
        behavior: "smooth",
      });
    });
  }, [selectedTaskId]);

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
      ref={canvasRef}
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
            isSelected={entry.task.id === selectedTaskId}
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
