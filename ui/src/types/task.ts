export const taskStatuses = [
    "OPEN",
    "IN PROGRESS",
    "IMPLEMENTED",
    "CLOSE",
] as const;

export type TaskStatus = (typeof taskStatuses)[number];

export type Task = {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
};
