import {useEffect, useMemo, useState} from "react";
import {Group, Panel, Separator} from "react-resizable-panels";
import {RightPanel} from "./components/rightPanel/RightPanel.tsx";
import {TaskPanel} from "./components/leftPanel/TaskPanel.tsx";
import type {Task, TaskStatus} from "./types/task";
import "./App.css";
import useTasks from "@/src/hooks/useTasks.ts";
import {useTaskSelectionState} from "@/src/states/taskSelectionState.ts";

function App() {
    const {tasks, addTask: at, deleteTask, updateTask} = useTasks({limit: 50, offset: 0});
    const [onUITasks, setOnUITasks] = useState<Task[]>([]);
    const selectedTaskId = useTaskSelectionState((state) => state.selectedTaskId);
    const clearSelectedTask = useTaskSelectionState((state) => state.clearSelectedTask);

    useEffect(() => {
        setOnUITasks(tasks);
    }, [tasks]);

    useEffect(() => {
        if (selectedTaskId && !tasks.some((task) => task.id === selectedTaskId)) {
            clearSelectedTask();
        }
    }, [clearSelectedTask, selectedTaskId, tasks]);

    const remainingTasks = useMemo(
        () => onUITasks.filter((task) => task.status === "OPEN").length,
        [onUITasks],
    );

    async function addTask(title: string, description: string, status: TaskStatus) {
        await at({title, description, status});
    }

    async function removeTasks(taskIds: string[]) {
        await Promise.all(taskIds.map((taskId) => deleteTask(taskId)));
    }

    function reorderTask(sourceTaskId: string, targetTaskId: string) {
        setOnUITasks((currentTasks) => {
            const sourceIndex = currentTasks.findIndex((task) => task.id === sourceTaskId);
            const targetIndex = currentTasks.findIndex((task) => task.id === targetTaskId);

            if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) {
                return currentTasks;
            }

            const nextTasks = [...currentTasks];
            const [movedTask] = nextTasks.splice(sourceIndex, 1);
            nextTasks.splice(targetIndex, 0, movedTask);

            return nextTasks;
        });
    }

    return (
        <Group className="app-shell" orientation="horizontal" role="main">
            <Panel defaultSize="360px" minSize="420px" maxSize="520px">
                <TaskPanel
                    tasks={onUITasks}
                    remainingTasks={remainingTasks}
                    onAddTask={addTask}
                    onRemoveTasks={removeTasks}
                    onReorderTask={reorderTask}
                />
            </Panel>
            <Separator className="panel-resize-handle" aria-label="Resize task panel"/>
            <Panel minSize="360px">
                <RightPanel tasks={onUITasks} onUpdateTask={updateTask}/>
            </Panel>
        </Group>
    );
}

export default App;
