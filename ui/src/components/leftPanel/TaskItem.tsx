import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "../../types/task.ts";
import {Button} from "@/components/ui/button.tsx";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import { cn } from "@/lib/utils.ts";
import { GripVertical, Trash } from "lucide-react";
import { Card } from "@/components/ui/card.tsx";
import { getTaskStatusOption } from "../common/taskStatus.tsx";

type TaskItemProps = {
  task: Task;
  isSelecting: boolean;
  isSelected: boolean;
  onRequestDeleteTask: (taskId: number) => void;
  onToggleTaskSelection: (taskId: number) => void;
};

export function TaskItem({
  task,
  isSelecting,
  isSelected,
  onRequestDeleteTask,
  onToggleTaskSelection,
}: TaskItemProps) {
  const statusOption = getTaskStatusOption(task.status);
  const StatusIcon = statusOption.icon;
  const {
    attributes,
    isDragging,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: task.id });

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "grid min-h-12 w-full items-center gap-2 rounded-[10px] border border-slate-200 bg-white px-2.5 py-2 text-[#172033] transition-[border-color,box-shadow,opacity] hover:border-primary/40",
        isSelecting
          ? "grid-cols-[18px_22px_minmax(0,1fr)_auto_26px]"
          : "grid-cols-[18px_minmax(0,1fr)_auto_26px]",
        isSelected && "border-primary/50 bg-slate-50",
        isDragging && "z-10 opacity-70 shadow-lg"
      )}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <button
        className="grid size-5 cursor-grab place-items-center rounded-md text-slate-300 hover:bg-slate-100 hover:text-slate-500 active:cursor-grabbing"
        type="button"
        aria-label={`Drag ${task.title}`}
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" aria-hidden="true" />
      </button>
      {isSelecting && (
        <Checkbox
          className="size-[22px] rounded-[8px] border-slate-300 bg-white text-white data-checked:border-primary data-checked:bg-primary"
          aria-label={`Select ${task.title}`}
          checked={isSelected}
          onClick={() => onToggleTaskSelection(task.id)}
        />
      )}
      <span
        className={cn(
          "relative min-w-0 overflow-hidden whitespace-nowrap text-left leading-[1.3] after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-6 after:bg-gradient-to-r after:from-transparent after:to-white after:content-['']",
          task.done && "text-slate-400 line-through"
        )}
      >
        {task.title}
      </span>
      <span
        className={cn(
          "flex h-[26px] max-w-[112px] items-center gap-1.5 rounded-[10px] border px-2 text-xs font-semibold",
          statusOption.badgeClassName
        )}
        title={statusOption.label}
      >
        <StatusIcon className="size-3.5 shrink-0" />
        <span className="min-w-0 truncate">{statusOption.label}</span>
      </span>
      <Button
        className="size-[26px] rounded-[10px] border-0 bg-transparent p-0 text-[22px] text-slate-400 hover:bg-red-100 hover:text-red-600"
        aria-label={`Delete ${task.title}`}
        onClick={() => onRequestDeleteTask(task.id)}
        size={'icon'}
        variant="ghost"
      >
          <Trash/>
      </Button>
    </Card>
  );
}
