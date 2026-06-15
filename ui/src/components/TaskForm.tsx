import {SubmitEvent, useState} from "react";

type TaskFormProps = {
  onAddTask: (title: string) => void;
};

export function TaskForm({ onAddTask }: TaskFormProps) {
  const [taskTitle, setTaskTitle] = useState("");

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();

    const title = taskTitle.trim();
    if (!title) {
      return;
    }

    onAddTask(title);
    setTaskTitle("");
  }

  return (
    <form className="grid grid-cols-[minmax(0,1fr)_auto] gap-2" onSubmit={handleSubmit}>
      <input
        className="min-h-9 min-w-0 rounded-lg border border-[#ccd6e3] bg-white px-3 py-1.5 text-[#172033] outline-none focus:border-black focus:shadow-[0_0_0_2px_rgba(0,0,0,0.14)]"
        aria-label="New task"
        value={taskTitle}
        onChange={(event) => setTaskTitle(event.currentTarget.value)}
        placeholder="Add a task..."
      />
      <button
        className="min-h-9 rounded-lg border-0 bg-primary px-3.5 py-1.5 font-bold text-white hover:bg-primary/70 transition-colors active:scale-95"
        type="submit"
      >
        Add
      </button>
    </form>
  );
}
