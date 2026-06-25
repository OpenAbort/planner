import { useEffect, useState } from "react";
import type { Task } from "@/src/types/task.ts";

const SEARCH_DEBOUNCE_MS = 220;

/**
 * Owns the left-panel search query, debounces it, and fetches matching tasks
 * from the backend. The `tasks` argument is used only as a change signal: when
 * the loaded task list mutates (add/delete/status edit) the active search is
 * re-run so results stay consistent with the database.
 */
export function useTaskSearch(
    searchTasks: (query: string) => Promise<Task[]>,
    tasks: Task[],
) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Task[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const trimmedQuery = query.trim();
    const isSearching = trimmedQuery.length > 0;

    useEffect(() => {
        if (!trimmedQuery) {
            setResults([]);
            setIsLoading(false);
            return;
        }

        let cancelled = false;
        setIsLoading(true);
        const handle = window.setTimeout(() => {
            searchTasks(trimmedQuery)
                .then((found) => {
                    if (!cancelled) {
                        setResults(found);
                    }
                })
                .catch((error) => {
                    if (!cancelled) {
                        console.error(error);
                        setResults([]);
                    }
                })
                .finally(() => {
                    if (!cancelled) {
                        setIsLoading(false);
                    }
                });
        }, SEARCH_DEBOUNCE_MS);

        return () => {
            cancelled = true;
            window.clearTimeout(handle);
        };
    }, [trimmedQuery, searchTasks, tasks]);

    return { query, setQuery, results, isLoading, isSearching };
}
