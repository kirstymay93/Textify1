import { useMemo, useRef, useState } from "react";

export function useEditorInitializer() {
  const containerRef = useRef<HTMLDivElement>(null);

  const [project] = useState({
    id: "1",
    title: "Untitled Document",
    blocks: [
      {
        id: "b1",
        type: "text",
        content: "Start writing here...",
      },
    ],
  });

  return {
    projectLoading: false,
    authLoading: false,
    project,
    containerRef,
  };
}