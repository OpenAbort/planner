import { SubmitEvent, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import type { TaskStatus } from "../../types/task.ts";
import { AddTaskDialog } from "../common/dialogs/AddTaskDialog.tsx";

type TaskFormProps = {
  onAddTask: (title: string, status: TaskStatus) => void;
};

export function TaskForm({ onAddTask }: TaskFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("OPEN");

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = taskTitle.trim();
    if (!title) {
      return;
    }

    onAddTask(title, taskStatus);
    setTaskTitle("");
    setTaskStatus("OPEN");
    setIsOpen(false);
  }

  function handleClose() {
    setIsOpen(false);
    setTaskTitle("");
    setTaskStatus("OPEN");
  }

  return (
    <>
      <Button
        className="h-9 w-full gap-2 rounded-lg bg-primary px-3.5 font-bold text-white transition-transform hover:bg-primary/70 active:scale-95"
        type="button"
        onClick={() => setIsOpen(true)}
      >
        <Plus className="size-4" />
        Add task
      </Button>

      {isOpen && (
        <AddTaskDialog
          taskTitle={taskTitle}
          taskStatus={taskStatus}
          onClose={handleClose}
          onSubmit={handleSubmit}
          onTaskStatusChange={setTaskStatus}
          onTaskTitleChange={setTaskTitle}
        />
      )}
    </>
  );
}
