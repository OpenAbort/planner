import { Trash } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

type TaskSelectionToolbarProps = {
  selectedCount: number;
  selectedTasksLabel: string;
  onCancel: () => void;
  onDelete: () => void;
};

export function TaskSelectionToolbar({
  selectedCount,
  selectedTasksLabel,
  onCancel,
  onDelete,
}: TaskSelectionToolbarProps) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2">
      <span className="min-w-0 truncate text-sm font-semibold text-slate-700">
        {selectedTasksLabel}
      </span>
      <Button
        className="h-8 rounded-lg px-2.5 text-xs font-semibold text-slate-600 hover:bg-white"
        type="button"
        variant="ghost"
        onClick={onCancel}
      >
        Cancel
      </Button>
      <Button
        className="h-8 gap-1.5 rounded-2xl bg-primary px-2.5 text-xs font-semibold disabled:pointer-events-none disabled:opacity-45"
        type="button"
        disabled={selectedCount === 0}
        onClick={onDelete}
      >
        <Trash className="size-3.5" />
        Delete
      </Button>
    </div>
  );
}
