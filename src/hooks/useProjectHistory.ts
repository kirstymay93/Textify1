import { useState } from "react";

export interface Snapshot {
  id: string;
  name: string;
  thumbnail?: string;
  createdAt: Date;
}

export function useProjectHistory() {
  const [history, setHistory] = useState<Snapshot[]>([]);

  const addSnapshot = (name: string, thumbnail?: string) => {
    const snapshot: Snapshot = {
      id: `snapshot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      thumbnail,
      createdAt: new Date(),
    };

    setHistory((prev) => [snapshot, ...prev]);

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