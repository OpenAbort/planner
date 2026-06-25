import {useCallback, useEffect, useState} from "react";
import {invoke} from "@tauri-apps/api/core";
import {Task, TaskStatus} from "@/src/types/task.ts";

type UseTasksParams = {
    limit: number;
    offset: number;
};

type AddTaskParams = {
    title: string;
    description: string;
    status: TaskStatus;
    startDate?: string | null;
    dueDate?: string | null;
};

type UpdateTaskParams = {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    startDate: string | null;
    dueDate: string | null;
};

export default function useTasks({limit, offset}: UseTasksParams) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadTasks = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const result = await invoke<Task[]>("list_tasks", {
                limit,
                offset,
            });

            setTasks(result);
            return result;
        } catch (e) {
            const message = String(e);
            setError(message);
            throw e;
        } finally {
            setLoading(false);
        }
    }, [limit, offset]);

    const searchTasks = useCallback(
        async (query: string, searchLimit = limit, searchOffset = 0) =>
            invoke<Task[]>("search_tasks", {
                query,
                limit: searchLimit,
                offset: searchOffset,
            }),
        [limit],
    );

    const addTask = useCallback(async ({title, description, status, startDate = null, dueDate = null}: AddTaskParams) => {
        const createdTask = await invoke<Task>("add_task", {
            title,
            description,
            status,
            startDate,
            dueDate,
        });

        setTasks((prev) => [createdTask, ...prev]);

        return createdTask;
    }, []);

    const updateTaskStatus = useCallback(async (id: string, status: string) => {
        const updatedTask = await invoke<Task | null>("update_task_status", {
            id,
            status,
        });

        if (updatedTask) {
            setTasks((prev) =>
                prev.map((task) =>
                    task.id === id ? updatedTask : task
                )
            );
        }

        return updatedTask;
    }, []);

    const updateTask = useCallback(async ({id, title, description, status, startDate, dueDate}: UpdateTaskParams) => {
        const updatedTask = await invoke<Task | null>("update_task", {
            id,
            title,
            description,
            status,
            startDate,
            dueDate,
        });

        if (updatedTask) {
            setTasks((prev) =>
                prev.map((task) =>
                    task.id === id ? updatedTask : task
                )
            );
        }

        return updatedTask;
    }, []);

    const deleteTask = useCallback(async (id: string) => {
        const deleted = await invoke<boolean>("delete_task", {
            id,
        });

        if (deleted) {
            setTasks((prev) => prev.filter((task) => task.id !== id));
        }

        return deleted;
    }, []);

    useEffect(() => {
        loadTasks().catch(console.error);
    }, [loadTasks]);

    return {
        tasks,
        loading,
        error,
        loadTasks,
        searchTasks,
        addTask,
        updateTask,
        updateTaskStatus,
        deleteTask,
    };
}
