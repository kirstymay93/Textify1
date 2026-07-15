import { createWorkspace, normalizeWorkspace, type WorkspaceState } from "@/lib/editorUtils";

export const WORKSPACE_STORAGE_KEY = "textify1.workspace.v1";

export interface WorkspaceAdapter {
  load(): Promise<WorkspaceState>;
  save(workspace: WorkspaceState): Promise<void>;
  clear(): Promise<void>;
}

export function createLocalWorkspaceAdapter(
  storage: Storage | undefined = typeof window !== "undefined" ? window.localStorage : undefined
): WorkspaceAdapter {
  return {
    async load() {
      if (!storage) {
        return createWorkspace();
      }

      const raw = storage.getItem(WORKSPACE_STORAGE_KEY);
      if (!raw) {
        return createWorkspace();
      }

      try {
        return normalizeWorkspace(JSON.parse(raw));
      } catch {
        return createWorkspace();
      }
    },
    async save(workspace: WorkspaceState) {
      if (!storage) return;
      storage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(workspace));
    },
    async clear() {
      storage?.removeItem(WORKSPACE_STORAGE_KEY);
    },
  };
}

export function createMemoryWorkspaceAdapter(initialWorkspace?: WorkspaceState): WorkspaceAdapter {
  let snapshot = initialWorkspace ? normalizeWorkspace(initialWorkspace) : createWorkspace();

  return {
    async load() {
      return snapshot;
    },
    async save(workspace: WorkspaceState) {
      snapshot = normalizeWorkspace(workspace);
    },
    async clear() {
      snapshot = createWorkspace();
    },
  };
}
