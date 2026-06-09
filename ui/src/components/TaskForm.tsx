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
    <form className="task-form" onSubmit={handleSubmit}>
      <input
        aria-label="New task"
        value={taskTitle}
        onChange={(event) => setTaskTitle(event.currentTarget.value)}
        placeholder="Add a task..."
      />
      <button type="submit">Add</button>
    </form>
  );
}
