import { FormEvent, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import type { Task, TaskStatus } from "../../types/task.ts";
import { AddTaskDialog } from "../common/dialogs/AddTaskDialog.tsx";

type TaskFormProps = {
  onAddTask: (
    title: string,
    description: string,
    status: TaskStatus,
    startDate: string | null,
    dueDate: string | null,
  ) => void | Promise<Task>;
};

export function TaskForm({ onAddTask }: TaskFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskStatus, setTaskStatus] = useState<TaskStatus>("OPEN");
  const [taskStartDate, setTaskStartDate] = useState("");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = taskTitle.trim();
    if (!title) {
      return;
    }

    if (taskStartDate && taskDueDate && taskDueDate < taskStartDate) {
      setFormError("Due date must be on or after start date.");
      return;
    }

    onAddTask(
      title,
      taskDescription.trim(),
      taskStatus,
      taskStartDate || null,
      taskDueDate || null,
    );
    setTaskTitle("");
    setTaskDescription("");
    setTaskStatus("OPEN");
    setTaskStartDate("");
    setTaskDueDate("");
    setFormError(null);
    setIsOpen(false);
  }

  function handleClose() {
    setIsOpen(false);
    setTaskTitle("");
    setTaskDescription("");
    setTaskStatus("OPEN");
    setTaskStartDate("");
    setTaskDueDate("");
    setFormError(null);
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
          taskDescription={taskDescription}
          taskStatus={taskStatus}
          taskStartDate={taskStartDate}
          taskDueDate={taskDueDate}
          formError={formError}
          onClose={handleClose}
          onSubmit={handleSubmit}
          onTaskDescriptionChange={setTaskDescription}
          onTaskDueDateChange={(value) => {
            setTaskDueDate(value);
            setFormError(null);
          }}
          onTaskStartDateChange={(value) => {
            setTaskStartDate(value);
            setFormError(null);
          }}
          onTaskStatusChange={setTaskStatus}
          onTaskTitleChange={setTaskTitle}
        />
      )}
    </>
  );
}
