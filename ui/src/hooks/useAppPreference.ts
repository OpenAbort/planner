import { useCallback, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

type AppPreference = {
    key: string;
    value: string;
};

type UseAppPreferenceParams<T> = {
    defaultValue: T;
    deserialize: (value: string) => T | null;
    key: string;
    serialize: (value: T) => string;
};

export function useAppPreference<T>({
    defaultValue,
    deserialize,
    key,
    serialize,
}: UseAppPreferenceParams<T>) {
    const [value, setValue] = useState<T>(defaultValue);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const saveValue = useCallback(
        async (nextValue: T) => {
            setValue(nextValue);
            setError(null);

            try {
                await invoke<AppPreference>("upsert_app_preference", {
                    key,
                    value: serialize(nextValue),
                });
            } catch (e) {
                const message = String(e);
                setError(message);
                throw e;
            }
        },
        [key, serialize],
    );

    useEffect(() => {
        let isCurrent = true;

        setLoading(true);
        setError(null);

        invoke<AppPreference | null>("get_app_preference", { key })
            .then((preference) => {
                if (!isCurrent || !preference) {
                    return;
                }

                const nextValue = deserialize(preference.value);

                if (nextValue !== null) {
                    setValue(nextValue);
                }
            })
            .catch((e) => {
                const message = String(e);
                setError(message);
            })
            .finally(() => {
                if (isCurrent) {
                    setLoading(false);
                }
            });

        return () => {
            isCurrent = false;
        };
    }, [deserialize, key]);

    return {
        error,
        loading,
        setValue: saveValue,
        value,
    };
}
