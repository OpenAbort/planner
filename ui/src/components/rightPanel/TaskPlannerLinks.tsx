import {
  getConnectorPoint,
  getTargetPoint,
} from "./taskPlannerGeometry.ts";
import type { NodePosition, PlannerLink } from "./states/taskPlannerState.ts";

type ActiveConnector = {
  prerequisiteTaskId: string;
  x: number;
  y: number;
};

type TaskPlannerLinksProps = {
  activeConnector: ActiveConnector | null;
  canvasSize: {
    width: number;
    height: number;
  };
  links: PlannerLink[];
  positions: Record<string, NodePosition>;
};

export function TaskPlannerLinks({
  activeConnector,
  canvasSize,
  links,
  positions,
}: TaskPlannerLinksProps) {
  return (
    <svg
      className="task-planner-links"
      style={{ width: canvasSize.width, height: canvasSize.height }}
      aria-hidden="true"
    >
      <defs>
        <marker
          id="planner-arrow"
          markerHeight="8"
          markerWidth="8"
          orient="auto"
          refX="7"
          refY="4"
        >
          <path d="M0,0 L8,4 L0,8 Z" fill="#64748b" />
        </marker>
      </defs>
      {links.map((link) => {
        const source = getConnectorPoint(positions[link.prerequisiteTaskId]);
        const target = getTargetPoint(positions[link.taskId]);

        return (
          <line
            key={`${link.prerequisiteTaskId}-${link.taskId}`}
            x1={source.x}
            y1={source.y}
            x2={target.x}
            y2={target.y}
            markerEnd="url(#planner-arrow)"
          />
        );
      })}
      {activeConnector && (
        <line
          className="active"
          x1={getConnectorPoint(positions[activeConnector.prerequisiteTaskId]).x}
          y1={getConnectorPoint(positions[activeConnector.prerequisiteTaskId]).y}
          x2={activeConnector.x}
          y2={activeConnector.y}
        />
      )}
    </svg>
  );
}
