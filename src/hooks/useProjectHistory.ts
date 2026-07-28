import { useState } from "react";

export interface Snapshot {
  id: string;
  name: string;
  thumbnail?: string;
  timestamp: number;
}

const HISTORY_LIMIT = 50;

function createSnapshotId(): string {
  return `snapshot-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

export function useProjectHistory() {
  const [history, setHistory] = useState<Snapshot[]>([]);

  const addSnapshot = (name: string, thumbnail?: string) => {
    const snapshot: Snapshot = {
      id: createSnapshotId(),
      name,
      thumbnail,
      timestamp: Date.now(),
    };

    setHistory((prev) => [snapshot, ...prev].slice(0, HISTORY_LIMIT));

    return snapshot.id;
  };

  const getSnapshot = (id: string) => {
    return history.find((snapshot) => snapshot.id === id);
  };

  const clearHistory = () => {
    setHistory([]);
  };

  return {
    history,
    addSnapshot,
    getSnapshot,
    clearHistory,
  };
}