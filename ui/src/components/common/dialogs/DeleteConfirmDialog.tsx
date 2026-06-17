import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

type DeleteConfirmDialogProps = {
  count: number;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteConfirmDialog({
  count,
  onCancel,
  onConfirm,
}: DeleteConfirmDialogProps) {
  const taskLabel = count === 1 ? "task" : "tasks";

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel();
        }
      }}
    >
      <section
        className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-xl"
        aria-label="Confirm delete"
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-4 flex items-start gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-red-50 text-red-600">
            <AlertTriangle className="size-5" />
          </span>
          <div className="min-w-0">
            <h2 className="m-0 text-base font-semibold text-slate-950">
              Delete {taskLabel}
            </h2>
            <p className="mt-1 mb-0 text-sm leading-5 text-slate-600">
              This will delete {count} selected {taskLabel}. This action cannot
              be undone.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            className="h-9 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50"
            type="button"
            variant="ghost"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            className="h-9 rounded-lg bg-red-600 font-semibold text-white hover:bg-red-700"
            type="button"
            onClick={onConfirm}
          >
            Delete
          </Button>
        </div>
      </section>
    </div>
  );
}
