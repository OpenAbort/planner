import type { TimelineLayout } from "./timelineLayout.ts";

type TimelineAxisProps = {
  layout: TimelineLayout;
};

export function TimelineAxis({ layout }: TimelineAxisProps) {
  return (
    <div className="timeline-axis" aria-hidden="true">
      {layout.ticks.map((tick) => (
        <div
          className="timeline-tick"
          key={`${tick.left}-${tick.label}`}
          style={{
            left: tick.left,
            height: layout.height - 24,
          }}
        >
          <span>{tick.label}</span>
        </div>
      ))}
    </div>
  );
}
