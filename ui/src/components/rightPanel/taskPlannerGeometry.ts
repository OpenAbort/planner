import type { NodePosition } from "./states/taskPlannerState.ts";

export const NODE_WIDTH = 190;
export const NODE_HEIGHT = 82;

export const GRID_LEFT = 40;
export const GRID_TOP = 40;
export const GRID_X = 240;
export const GRID_Y = 130;
export const GRID_COLUMNS = 3;

export function getDefaultPosition(index: number): NodePosition {
  return {
    x: GRID_LEFT + (index % GRID_COLUMNS) * GRID_X,
    y: GRID_TOP + Math.floor(index / GRID_COLUMNS) * GRID_Y,
  };
}

export function getConnectorPoint(position: NodePosition) {
  return {
    x: position.x + NODE_WIDTH + 1,
    y: position.y + NODE_HEIGHT / 2,
  };
}

export function getTargetPoint(position: NodePosition) {
  return {
    x: position.x,
    y: position.y + NODE_HEIGHT / 2,
  };
}
