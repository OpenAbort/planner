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
    startDate: string | null;
    dueDate: string | null;
};

export type TaskPrerequisiteLink = {
    prerequisiteTaskId: string;
    taskId: string;
    label: string | null;
};

export type TaskPlannerPosition = {
    taskId: string;
    x: number;
    y: number;
};
