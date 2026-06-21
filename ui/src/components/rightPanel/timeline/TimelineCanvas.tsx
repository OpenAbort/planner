import { TimelineAxis } from "./TimelineAxis.tsx";
import { TimelineTaskBar } from "./TimelineTaskBar.tsx";
import type { Task, TaskPrerequisiteLink } from "@/src/types/task.ts";
import type { TimelineLayout } from "./timelineLayout.ts";

type TimelineCanvasProps = {
  layout: TimelineLayout;
  tasks: Task[];
  prerequisiteLinks: TaskPrerequisiteLink[];
};

export function TimelineCanvas({ layout, tasks, prerequisiteLinks }: TimelineCanvasProps) {
  return (
    <div className="timeline-canvas" role="img" aria-label="Task schedule timeline">
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
            height: layout.height - 24,
          }}
        >
          <span>Now</span>
        </div>
        {layout.unscheduledTop !== null && (
          <>
            <div
              className="timeline-unscheduled-rule"
              style={{ top: layout.unscheduledTop - 24 }}
            />
            <div
              className="timeline-unscheduled-label"
              style={{ top: layout.unscheduledTop - 28 }}
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
          />
        ))}
      </div>
    </div>
  );
}
