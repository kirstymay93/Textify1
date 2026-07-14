import { useState, useEffect } from "react";
import type { Block } from "@/types/block";

interface Project {
  id: string;
  title: string;
  blocks: Block[];
}

interface UseEditorInitializerReturn {
  project: Project;
  authLoading: boolean;
  projectLoading: boolean;
}

const DEFAULT_PROJECT: Project = {
  id: "1",
  title: "Untitled Document",
  blocks: [
    { id: crypto.randomUUID(), content: "" },
  ],
};

export function useEditorInitializer(): UseEditorInitializerReturn {
  const [project] = useState<Project>(DEFAULT_PROJECT);
  const [authLoading] = useState(false);
  const [projectLoading] = useState(false);

  return { project, authLoading, projectLoading };
}
