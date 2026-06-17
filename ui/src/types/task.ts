export const taskStatuses = [
  "OPEN",
  "IN PROGRESS",
  "IMPLEMENTED",
  "CLOSE",
] as const;

export type TaskStatus = (typeof taskStatuses)[number];

export type Task = {
  id: number;
  title: string;
  done: boolean;
  status: TaskStatus;
};
