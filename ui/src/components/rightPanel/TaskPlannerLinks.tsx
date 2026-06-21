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
  isEditMode: boolean;
  links: PlannerLink[];
  onOpenLinkMenu: (link: PlannerLink, position: NodePosition) => void;
  positions: Record<string, NodePosition>;
};

export function TaskPlannerLinks({
  activeConnector,
  canvasSize,
  isEditMode,
  links,
  onOpenLinkMenu,
  positions,
}: TaskPlannerLinksProps) {
  return (
    <svg
      className="task-planner-links"
      style={{ width: canvasSize.width, height: canvasSize.height }}
      aria-label="Task planner prerequisite connections"
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
        const midpoint = {
          x: source.x + (target.x - source.x) / 2,
          y: source.y + (target.y - source.y) / 2,
        };
        const angle =
          (Math.atan2(target.y - source.y, target.x - source.x) * 180) / Math.PI;
        const hasLabel = Boolean(link.label?.trim());
        const labelText = link.label?.trim() || "Link";
        const shouldShowLabel = isEditMode || hasLabel;

        return (
          <g key={`${link.prerequisiteTaskId}-${link.taskId}`}>
            <line
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              markerEnd="url(#planner-arrow)"
            />
            {isEditMode && (
              <line
                className="task-planner-link-hit-target"
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onOpenLinkMenu(link, midpoint);
                }}
              />
            )}
            {shouldShowLabel && (
              <foreignObject
                className="task-planner-link-label-wrap"
                x={midpoint.x - 54}
                y={midpoint.y - 15}
                width="108"
                height="30"
                transform={`rotate(${angle} ${midpoint.x} ${midpoint.y})`}
              >
                {isEditMode ? (
                  <button
                    className={`task-planner-link-label${hasLabel ? "" : " empty"}`}
                    type="button"
                    title={hasLabel ? link.label ?? "" : "Edit connection label"}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onOpenLinkMenu(link, midpoint);
                    }}
                  >
                    {labelText}
                  </button>
                ) : (
                  <span className="task-planner-link-label readonly">{labelText}</span>
                )}
              </foreignObject>
            )}
          </g>
        );
      })}
      {isEditMode && activeConnector && (
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
