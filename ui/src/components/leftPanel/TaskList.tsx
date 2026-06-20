import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TaskItem } from "./TaskItem.tsx";
import type { Task } from "../../types/task.ts";

type TaskListProps = {
  tasks: Task[];
  isSelecting: boolean;
  selectedTaskIds: Set<string>;
  onRequestDeleteTask: (taskId: string) => void;
  onReorderTask: (sourceTaskId: string, targetTaskId: string) => void;
  onSelectTask: (taskId: string) => void;
  onToggleTaskSelection: (taskId: string) => void;
};

export function TaskList({
  tasks,
  isSelecting,
  selectedTaskIds,
  onRequestDeleteTask,
  onReorderTask,
  onSelectTask,
  onToggleTaskSelection,
}: TaskListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    onReorderTask(String(active.id), String(over.id));
  }

  return (
    <DndContext
      collisionDetection={closestCenter}
      sensors={sensors}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <section
          className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto [scrollbar-color:#e2e8f0_transparent] [scrollbar-width:thin]
          [&::-webkit-scrollbar]:w-px [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-track]:bg-transparent"
          aria-label="All tasks"
        >
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              isSelecting={isSelecting}
              isSelected={selectedTaskIds.has(task.id)}
              onRequestDeleteTask={onRequestDeleteTask}
              onSelectTask={onSelectTask}
              onToggleTaskSelection={onToggleTaskSelection}
            />
          ))}
        </section>
      </SortableContext>
    </DndContext>
  );
}
