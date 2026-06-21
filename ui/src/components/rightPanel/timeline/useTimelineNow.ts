import { useEffect, useState } from "react";

export function useTimelineNow(updateMs = 10_000) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, updateMs);

    return () => window.clearInterval(intervalId);
  }, [updateMs]);

  return now;
}
