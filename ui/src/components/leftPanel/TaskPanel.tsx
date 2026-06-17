import { useMemo, useState } from "react";
import {Button} from "@/components/ui/button.tsx";
import {TaskForm} from "./TaskForm.tsx";
import {TaskList} from "./TaskList.tsx";
import {DeleteConfirmDialog} from "../common/dialogs/DeleteConfirmDialog.tsx";
import { TaskSelectionToolbar } from "./TaskSelectionToolbar.tsx";
import type {Task, TaskStatus} from "../../types/task.ts";
import {useLeftPanelState} from "@/src/components/leftPanel/states/leftPanelStates.ts";

type TaskPanelProps = {
    tasks: Task[];
    remainingTasks: number;
    onAddTask: (title: string, status: TaskStatus) => void;
    onRemoveTasks: (taskIds: number[]) => void;
    onReorderTask: (sourceTaskId: number, targetTaskId: number) => void;
};

export function TaskPanel({
                              tasks,
                              remainingTasks,
                              onAddTask,
                              onRemoveTasks,
                              onReorderTask,
                          }: TaskPanelProps) {
    const state = useLeftPanelState();
    const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(
        () => new Set()
    );
    const [deleteTaskIds, setDeleteTaskIds] = useState<number[] | null>(null);

    const selectedCount = selectedTaskIds.size;
    const deleteCount = deleteTaskIds?.length ?? 0;

    const selectedTasksLabel = useMemo(
        () => `${selectedCount} selected`,
        [selectedCount]
    );

    function toggleTaskSelection(taskId: number) {
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
        setSelectedTaskIds((currentTaskIds: any) => {
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

            <TaskForm onAddTask={onAddTask}/>
            {!state.isTaskItemSelecting && (
                <Button
                    className="h-9 w-full rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50"
                    type="button"
                    variant="ghost"
                    onClick={() => state.toggle(true)}
                >
                    Select
                </Button>
            )}
            {state.isTaskItemSelecting && (
                <TaskSelectionToolbar
                    selectedCount={selectedCount}
                    selectedTasksLabel={selectedTasksLabel}
                    onCancel={stopSelecting}
                    onDelete={() => setDeleteTaskIds([...selectedTaskIds])}
                />
            )}
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
