import { useState, useCallback } from "react";
import type { HistorySnapshot } from "@/components/ProjectOverview";

export function useProjectHistory() {
  const [history, setHistory] = useState<HistorySnapshot[]>([]);

  const addSnapshot = useCallback(
    (name: string, thumbnail?: string) => {
      const snapshot: HistorySnapshot = {
        id: `snapshot-${Date.now()}`,
        timestamp: Date.now(),
        name,
        thumbnail,
      };

      setHistory((prev) => [snapshot, ...prev].slice(0, 50)); // Keep last 50 snapshots
    },
    []
  );

  const getSnapshot = useCallback(
    (snapshotId: string) => {
      return history.find((s) => s.id === snapshotId);
    },
    [history]
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    history,
    addSnapshot,
    getSnapshot,
    clearHistory,
  };
}
