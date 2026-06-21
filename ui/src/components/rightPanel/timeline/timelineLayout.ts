import type { Task, TaskPrerequisiteLink } from "@/src/types/task.ts";

export type TimelineTask = {
  task: Task;
  left: number;
  top?: number;
  bottom?: number;
  width: number;
  isMilestone: boolean;
  isUnscheduled: boolean;
  conflictTitles: string[];
};

export type TimelineTick = {
  left: number;
  label: string;
};

export type TimelineLayout = {
  tasks: TimelineTask[];
  ticks: TimelineTick[];
  width: number;
  height: number;
  axisStartMs: number;
  axisEndMs: number;
  nowLeft: number;
  scheduledHeight: number;
  unscheduledTop: number | null;
  unscheduledBottom: number | null;
  riskOverlay: {
    left: number;
    width: number;
  } | null;
};

const AXIS_LEFT = 132;
const AXIS_RIGHT_PADDING = 48;
const AXIS_TOP = 58;
const ROW_HEIGHT = 56;
const MIN_BAR_WIDTH = 42;
const MIN_AXIS_WIDTH = 760;
const UNSCHEDULED_GAP = 52;
const UNSCHEDULED_TASK_WIDTH = 220;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export function parseTimelineDate(value: string | null) {
  if (!value) {
    return null;
  }

  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

export function createTimelineLayout(
  tasks: Task[],
  links: TaskPrerequisiteLink[],
  nowMs: number,
): TimelineLayout {
  const scheduled = tasks
    .map((task, index) => ({
      task,
      index,
      startMs: parseTimelineDate(task.startDate),
      dueMs: parseTimelineDate(task.dueDate),
    }))
    .filter((entry) => entry.dueMs !== null)
    .sort((left, right) => {
      const leftTime = left.startMs ?? left.dueMs ?? 0;
      const rightTime = right.startMs ?? right.dueMs ?? 0;
      return leftTime - rightTime || left.index - right.index;
    });

  const unscheduled = tasks.filter((task) => !task.dueDate);
  const timeValues = scheduled.flatMap((entry) =>
    entry.startMs === null ? [entry.dueMs as number] : [entry.startMs, entry.dueMs as number],
  );

  const rawStartMs = Math.min(...timeValues, nowMs);
  const rawEndMs = Math.max(...timeValues, nowMs);
  const paddingMs = Math.max(HOUR_MS, (rawEndMs - rawStartMs) * 0.12);
  const axisStartMs = Math.floor((rawStartMs - paddingMs) / HOUR_MS) * HOUR_MS;
  const axisEndMs = Math.ceil((rawEndMs + paddingMs) / HOUR_MS) * HOUR_MS;
  const spanMs = Math.max(HOUR_MS, axisEndMs - axisStartMs);
  const axisWidth = Math.max(MIN_AXIS_WIDTH, Math.min(2600, spanMs / HOUR_MS * 54));
  const width = AXIS_LEFT + axisWidth + AXIS_RIGHT_PADDING;
  const scale = axisWidth / spanMs;
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const conflictTitlesByTaskId = getConflictTitlesByTaskId(tasks, links, taskById);

  const timelineTasks: TimelineTask[] = scheduled.map((entry, rowIndex) => {
    const dueMs = entry.dueMs as number;
    const startMs = entry.startMs ?? dueMs;
    const rawLeft = AXIS_LEFT + (startMs - axisStartMs) * scale;
    const rawRight = AXIS_LEFT + (dueMs - axisStartMs) * scale;
    const isMilestone = entry.startMs === null;
    const width = Math.max(MIN_BAR_WIDTH, rawRight - rawLeft);
    const left = isMilestone ? rawRight - width : rawLeft;

    return {
      task: entry.task,
      left,
      top: AXIS_TOP + rowIndex * ROW_HEIGHT,
      width,
      isMilestone,
      isUnscheduled: false,
      conflictTitles: conflictTitlesByTaskId.get(entry.task.id) ?? [],
    };
  });

  const scheduledHeight = AXIS_TOP + scheduled.length * ROW_HEIGHT;
  const unscheduledTop = unscheduled.length > 0
    ? scheduledHeight + UNSCHEDULED_GAP
    : null;

  unscheduled.forEach((task, index) => {
    timelineTasks.push({
      task,
      left: AXIS_LEFT,
      bottom: (unscheduled.length - index - 1) * ROW_HEIGHT + 74,
      width: UNSCHEDULED_TASK_WIDTH,
      isMilestone: false,
      isUnscheduled: true,
      conflictTitles: [],
    });
  });

  const ticks = createTicks(axisStartMs, axisEndMs, scale);
  const activeTasks = timelineTasks.filter((entry) => {
    const startMs = parseTimelineDate(entry.task.startDate);
    const dueMs = parseTimelineDate(entry.task.dueDate);
    return startMs !== null && dueMs !== null && startMs <= nowMs && nowMs <= dueMs;
  });
  const earliestActiveLeft = Math.min(...activeTasks.map((entry) => entry.left));
  const nowLeft = AXIS_LEFT + (nowMs - axisStartMs) * scale;

  return {
    tasks: timelineTasks,
    ticks,
    width,
    height: Math.max(360, (unscheduledTop ?? scheduledHeight) + unscheduled.length * ROW_HEIGHT + 48),
    axisStartMs,
    axisEndMs,
    nowLeft,
    scheduledHeight,
    unscheduledTop,
    unscheduledBottom: unscheduled.length > 0
      ? unscheduled.length * ROW_HEIGHT + 72
      : null,
    riskOverlay: activeTasks.length > 0
      ? {
          left: earliestActiveLeft,
          width: Math.max(0, nowLeft - earliestActiveLeft),
        }
      : null,
  };
}

function getConflictTitlesByTaskId(
  tasks: Task[],
  links: TaskPrerequisiteLink[],
  taskById: Map<string, Task>,
) {
  const conflictTitlesByTaskId = new Map<string, string[]>();
  const taskIdSet = new Set(tasks.map((task) => task.id));

  links.forEach((link) => {
    if (!taskIdSet.has(link.prerequisiteTaskId) || !taskIdSet.has(link.taskId)) {
      return;
    }

    const prerequisite = taskById.get(link.prerequisiteTaskId);
    const dependent = taskById.get(link.taskId);
    const prerequisiteDueMs = parseTimelineDate(prerequisite?.dueDate ?? null);
    const dependentScheduledMs = parseTimelineDate(dependent?.startDate ?? dependent?.dueDate ?? null);

    if (
      prerequisite &&
      dependent &&
      prerequisiteDueMs !== null &&
      dependentScheduledMs !== null &&
      dependentScheduledMs < prerequisiteDueMs
    ) {
      conflictTitlesByTaskId.set(link.taskId, [
        ...(conflictTitlesByTaskId.get(link.taskId) ?? []),
        prerequisite.title,
      ]);
    }
  });

  return conflictTitlesByTaskId;
}

function createTicks(axisStartMs: number, axisEndMs: number, scale: number) {
  const spanMs = axisEndMs - axisStartMs;
  const stepMs = spanMs <= 12 * HOUR_MS
    ? HOUR_MS
    : spanMs <= 3 * DAY_MS
      ? 6 * HOUR_MS
      : DAY_MS;
  const formatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: stepMs < DAY_MS ? "2-digit" : undefined,
  });
  const firstTickMs = Math.ceil(axisStartMs / stepMs) * stepMs;
  const ticks: TimelineTick[] = [];

  for (let tickMs = firstTickMs; tickMs <= axisEndMs; tickMs += stepMs) {
    ticks.push({
      left: AXIS_LEFT + (tickMs - axisStartMs) * scale,
      label: formatter.format(new Date(tickMs)),
    });
  }

  return ticks;
}
