import {useMemo, useState} from "react";
import {Search, Settings, X} from "lucide-react";
import {Button} from "@/components/ui/button.tsx";
import {TaskForm} from "./TaskForm.tsx";
import {TaskList} from "./TaskList.tsx";
import {useTaskSearch} from "./useTaskSearch.ts";
import {DeleteConfirmDialog} from "../common/dialogs/DeleteConfirmDialog.tsx";
import {KafkaSettingsDialog} from "../common/dialogs/KafkaSettingsDialog.tsx";
import {TaskSelectionToolbar} from "./TaskSelectionToolbar.tsx";
import type {Task, TaskStatus} from "../../types/task.ts";
import {useLeftPanelState} from "@/src/components/leftPanel/states/leftPanelStates.ts";
import {Separator} from "@/components/ui/separator.tsx";
import {useTaskSelectionState} from "@/src/states/taskSelectionState.ts";

type TaskPanelProps = {
    tasks: Task[];
    remainingTasks: number;
    onAddTask: (
        title: string,
        description: string,
        status: TaskStatus,
        startDate: string | null,
        dueDate: string | null,
    ) => void | Promise<Task>;
    onSearchTasks: (query: string) => Promise<Task[]>;
    onRemoveTasks: (taskIds: string[]) => void;
    onReorderTask: (sourceTaskId: string, targetTaskId: string) => void;
};

export function TaskPanel({
                              tasks,
                              remainingTasks,
                              onAddTask,
                              onSearchTasks,
                              onRemoveTasks,
                              onReorderTask,
                          }: TaskPanelProps) {
    const state = useLeftPanelState();
    const {
        query: searchQuery,
        setQuery: setSearchQuery,
        results: searchResults,
        isLoading: isSearchLoading,
        isSearching,
    } = useTaskSearch(onSearchTasks, tasks);
    const displayedTasks = isSearching ? searchResults : tasks;
    const showSearchEmptyState =
        isSearching && !isSearchLoading && displayedTasks.length === 0;
    const selectedTaskId = useTaskSelectionState((selectionState) => selectionState.selectedTaskId);
    const selectTask = useTaskSelectionState((selectionState) => selectionState.selectTask);
    const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
        () => new Set()
    );
    const [deleteTaskIds, setDeleteTaskIds] = useState<string[] | null>(null);
    const [isKafkaSettingsOpen, setIsKafkaSettingsOpen] = useState(false);

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
                <div className="flex items-center gap-2">
                    <span className="task-count">{remainingTasks} open</span>
                    <Button
                        className="size-7 rounded-lg p-0 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Kafka settings"
                        onClick={() => setIsKafkaSettingsOpen(true)}
                    >
                        <Settings className="size-4" />
                    </Button>
                </div>
            </header>

            <div className="task-search">
                <Search className="task-search-icon size-4" aria-hidden="true"/>
                <input
                    className="task-search-input black-focus"
                    type="search"
                    aria-label="Search tasks by title"
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.currentTarget.value)}
                />
                {searchQuery && (
                    <button
                        className="task-search-clear"
                        type="button"
                        aria-label="Clear search"
                        onClick={() => setSearchQuery("")}
                    >
                        <X className="size-4"/>
                    </button>
                )}
            </div>

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
            {showSearchEmptyState ? (
                <p className="task-search-empty">No tasks match "{searchQuery.trim()}".</p>
            ) : (
                <TaskList
                    tasks={displayedTasks}
                    isSelecting={state.isTaskItemSelecting}
                    isReorderEnabled={!isSearching}
                    activeTaskId={selectedTaskId}
                    selectedTaskIds={selectedTaskIds}
                    onRequestDeleteTask={(taskId) => setDeleteTaskIds([taskId])}
                    onReorderTask={onReorderTask}
                    onSelectTask={selectTask}
                    onToggleTaskSelection={toggleTaskSelection}
                />
            )}
            {deleteTaskIds && (
                <DeleteConfirmDialog
                    count={deleteCount}
                    onCancel={() => setDeleteTaskIds(null)}
                    onConfirm={handleConfirmDelete}
                />
            )}
            {isKafkaSettingsOpen && (
                <KafkaSettingsDialog onClose={() => setIsKafkaSettingsOpen(false)} />
            )}
        </aside>
    );
}
