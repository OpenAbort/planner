import {useMemo, useState} from "react";
import {Button} from "@/components/ui/button.tsx";
import {TaskForm} from "./TaskForm.tsx";
import {TaskList} from "./TaskList.tsx";
import {DeleteConfirmDialog} from "../common/dialogs/DeleteConfirmDialog.tsx";
import {TaskSelectionToolbar} from "./TaskSelectionToolbar.tsx";
import type {Task, TaskStatus} from "../../types/task.ts";
import {useLeftPanelState} from "@/src/components/leftPanel/states/leftPanelStates.ts";
import {Separator} from "@/components/ui/separator.tsx";

type TaskPanelProps = {
    tasks: Task[];
    remainingTasks: number;
    onAddTask: (title: string, status: TaskStatus) => void;
    onRemoveTasks: (taskIds: string[]) => void;
    onReorderTask: (sourceTaskId: string, targetTaskId: string) => void;
};

export function TaskPanel({
                              tasks,
                              remainingTasks,
                              onAddTask,
                              onRemoveTasks,
                              onReorderTask,
                          }: TaskPanelProps) {
    const state = useLeftPanelState();
    const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
        () => new Set()
    );
    const [deleteTaskIds, setDeleteTaskIds] = useState<string[] | null>(null);

    const selectedCount = selectedTaskIds.size;
    const deleteCount = deleteTaskIds?.length ?? 0;

    const selectedTasksLabel = useMemo(
        () => `${selectedCount} selected`,
        [selectedCount]
    );

    function toggleTaskSelection(taskId: string) {
        setSelectedTaskIds((currentTaskIds) => {
            const nextTaskIds = new Set(currentTaskIds);

            if (nextTaskIds.has(taskId)) {
                nextTaskIds.delete(taskId);
            } else {
                nextTaskIds.add(taskId);
            }

            return nextTaskIds;
        });
    }

    function clearSelection() {
        setSelectedTaskIds(new Set());
    }

    function stopSelecting() {
        clearSelection();
        state.toggle(false);
    }

    function handleConfirmDelete() {
        if (!deleteTaskIds) {
            return;
        }

        onRemoveTasks(deleteTaskIds);
        setSelectedTaskIds((currentTaskIds) => {
            const deletedTaskIds = new Set(deleteTaskIds);
            return new Set(
                [...currentTaskIds].filter((taskId) => !deletedTaskIds.has(taskId))
            );
        });
        setDeleteTaskIds(null);
    }

    return (
        <aside className="task-panel h-screen overflow-hidden" aria-label="Task list">
            <header className="panel-header">
                <div>
                    <p className="eyebrow">Planner</p>
                    <h1>Tasks</h1>
                </div>
                <span className="task-count">{remainingTasks} open</span>
            </header>

            <div className="grid grid-cols-[1fr_auto] gap-2">
                <TaskForm onAddTask={onAddTask}/>
                {!state.isTaskItemSelecting && (
                    <Button
                        className="h-9 rounded-lg border border-slate-200 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-50"
                        type="button"
                        variant="ghost"
                        onClick={() => state.toggle(true)}
                    >
                        Select
                    </Button>
                )}
            </div>
            {state.isTaskItemSelecting && (
                <TaskSelectionToolbar
                    selectedCount={selectedCount}
                    selectedTasksLabel={selectedTasksLabel}
                    onCancel={stopSelecting}
                    onDelete={() => setDeleteTaskIds([...selectedTaskIds])}
                />
            )}
            <Separator/>
            <TaskList
                tasks={tasks}
                isSelecting={state.isTaskItemSelecting}
                selectedTaskIds={selectedTaskIds}
                onRequestDeleteTask={(taskId) => setDeleteTaskIds([taskId])}
                onReorderTask={onReorderTask}
                onToggleTaskSelection={toggleTaskSelection}
            />
            {deleteTaskIds && (
                <DeleteConfirmDialog
                    count={deleteCount}
                    onCancel={() => setDeleteTaskIds(null)}
                    onConfirm={handleConfirmDelete}
                />
            )}
        </aside>
    );
}
