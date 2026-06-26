import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

type AppPreference = { key: string; value: string };
type SaveStatus = "idle" | "saving" | "saved" | "error";

type Props = {
  onClose: () => void;
};

export function KafkaSettingsDialog({ onClose }: Props) {
  const [bootstrapServers, setBootstrapServers] = useState("");
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    invoke<AppPreference | null>("get_app_preference", {
      key: "kafka.bootstrap_servers",
    }).then((pref) => {
      if (pref) setBootstrapServers(pref.value);
    });
  }, []);

  async function handleSave() {
    const servers = bootstrapServers.trim();
    if (!servers) return;

    setStatus("saving");
    setErrorMessage(null);

    try {
      await invoke("update_kafka_config", { bootstrapServers: servers });
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 3000);
    } catch (e) {
      setStatus("error");
      setErrorMessage(String(e));
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/35 px-4"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="m-0 text-base font-semibold text-slate-950">
            Kafka Settings
          </h2>
          <Button
            className="size-8 rounded-lg p-0 text-slate-500 hover:bg-slate-100"
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close settings"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>

        <label className="mb-4 block">
          <span className="mb-1.5 block text-xs font-semibold text-slate-600">
            Bootstrap Servers
          </span>
          <input
            className="black-focus min-h-9 w-full min-w-0 rounded-lg border border-[#ccd6e3] bg-white px-3 py-1.5 text-[#172033] outline-none"
            autoFocus
            placeholder="localhost:9092"
            value={bootstrapServers}
            onChange={(e) => {
              setBootstrapServers(e.currentTarget.value);
              setStatus("idle");
              setErrorMessage(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
          />
          <p className="mt-1.5 text-xs text-slate-400">
            Comma-separated list, e.g. broker1:9092,broker2:9092
          </p>
        </label>

        {status === "error" && errorMessage && (
          <p className="mb-3 text-sm font-semibold text-red-600">{errorMessage}</p>
        )}
        {status === "saved" && (
          <p className="mb-3 text-sm font-semibold text-green-600">Settings saved.</p>
        )}

        <Button
          className="h-9 w-full rounded-lg bg-primary px-3.5 font-bold text-white hover:bg-primary/70"
          type="button"
          disabled={status === "saving" || !bootstrapServers.trim()}
          onClick={handleSave}
        >
          {status === "saving" ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
