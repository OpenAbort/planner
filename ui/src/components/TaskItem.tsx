import type { Task } from "../types/task";
import {Button} from "@/components/ui/button.tsx";
import {Checkbox} from "@/components/ui/checkbox.tsx";
import { cn } from "@/lib/utils";
import {Trash} from "lucide-react";

type TaskItemProps = {
  task: Task;
  onToggleTask: (taskId: number) => void;
  onRemoveTask: (taskId: number) => void;
};

export function TaskItem({
  task,
  onToggleTask,
  onRemoveTask,
}: TaskItemProps) {
  return (
    <Button
      className="grid min-h-12 w-full grid-cols-[26px_minmax(0,1fr)_26px] items-center gap-2 rounded-[10px] border border-slate-200 bg-white px-2.5 py-2 text-[#172033] hover:bg-white"
      variant="ghost"
    >
      <Checkbox
        className="size-[26px] rounded-[10px] border-slate-300 bg-white text-white data-checked:border-green-600 data-checked:bg-green-600"
        aria-label={task.done ? "Mark task open" : "Mark task done"}
        aria-pressed={task.done}
        checked={task.done}
        onClick={() => onToggleTask(task.id)}
      />
      <span
        className={cn(
          "min-w-0 [overflow-wrap:anywhere] text-left leading-[1.3]",
          task.done && "text-slate-400 line-through"
        )}
      >
        {task.title}
      </span>
      <Button
        className="size-[26px] rounded-[10px] border-0 bg-transparent p-0 text-[22px] text-slate-400 hover:bg-red-100 hover:text-red-600"
        aria-label={`Delete ${task.title}`}
        onClick={() => onRemoveTask(task.id)}
        size={'icon'}
        variant="ghost"
      >
          <Trash/>
      </Button>
    </Button>
  );
}
