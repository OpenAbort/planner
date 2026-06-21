import { CheckCircle2, Circle, Clock3, XCircle } from "lucide-react";
import type { TaskStatus } from "../../types/task.ts";

export const taskStatusOptions: Array<{
  value: TaskStatus;
  label: string;
  icon: typeof Circle;
  badgeClassName: string;
  optionClassName: string;
}> = [
  {
    value: "OPEN",
    label: "Open",
    icon: Circle,
    badgeClassName: "border-sky-200 bg-sky-50 text-sky-700",
    optionClassName: "border-sky-200 text-sky-700",
  },
  {
    value: "IN PROGRESS",
    label: "In progress",
    icon: Clock3,
    badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
    optionClassName: "border-amber-200 text-amber-700",
  },
  {
    value: "IMPLEMENTED",
    label: "Implemented",
    icon: CheckCircle2,
    badgeClassName: "border-emerald-200 bg-emerald-50 text-emerald-700",
    optionClassName: "border-emerald-200 text-emerald-700",
  },
  {
    value: "CLOSE",
    label: "Close",
    icon: XCircle,
    badgeClassName: "border-rose-200 bg-rose-50 text-rose-700",
    optionClassName: "border-rose-200 text-rose-700",
  },
];

export function getTaskStatusOption(status: TaskStatus) {
  return (
    taskStatusOptions.find((option) => option.value === status) ??
    taskStatusOptions[0]
  );
}
