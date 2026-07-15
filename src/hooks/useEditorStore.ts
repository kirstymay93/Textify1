import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  activateDocument,
  createDocument,
  createUntitledDocumentTitle,
  createWorkspace,
  deleteDocument as removeDocument,
  duplicateDocument as duplicateWorkspaceDocument,
  getActiveDocument,
  getRecentDocuments,
  getSortedDocuments,
  renameDocument as renameWorkspaceDocument,
  updateDocumentContent,
  replaceSelection,
  type SelectionRange,
  type WorkspaceState,
} from "@/lib/editorUtils";
import {
  createLocalWorkspaceAdapter,
  type WorkspaceAdapter,
} from "@/lib/editorPersistence";
import { useThemeMode } from "@/hooks/useThemeMode";

interface HistoryState {
  stack: string[];
  index: number;
}

interface ProjectView {
  id: string;
  title: string;
  blocks: Array<{ id: string; content: string }>;
}

export interface UseEditorInitializerReturn {
  project: ProjectView;
  workspace: WorkspaceState;
  activeDocument: ReturnType<typeof getActiveDocument>;
  documents: WorkspaceState["documents"];
  recentDocuments: WorkspaceState["documents"];
  content: string;
  selection: SelectionRange | null;
  authLoading: boolean;
  projectLoading: boolean;
  status: "loading" | "ready";
  errorMessage: string | null;
  isSaving: boolean;
  lastSavedAt: number | null;
  canUndo: boolean;
  canRedo: boolean;
  isFullscreen: boolean;
  theme: "light" | "dark";
  setSelection: (selection: SelectionRange | null) => void;
  setContent: (content: string) => void;
  replaceSelectedText: (replacement: string, selection?: SelectionRange | null) => void;
  createNewDocument: () => void;
  renameActiveDocument: (title: string) => void;
  duplicateActiveDocument: () => void;
  deleteActiveDocument: () => void;
  selectDocument: (documentId: string) => void;
  undo: () => void;
  redo: () => void;
  saveNow: () => Promise<void>;
  toggleFullscreen: () => void;
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;
  clearError: () => void;
}

const HISTORY_LIMIT = 100;

function clampHistory(stack: string[]): string[] {
  return stack.slice(-HISTORY_LIMIT);
}

function snapshotWorkspace(workspace: WorkspaceState, theme: "light" | "dark"): WorkspaceState {
  return {
    ...workspace,
    theme,
  };
}

export function useEditorInitializer(): UseEditorInitializerReturn {
  const adapterRef = useRef<WorkspaceAdapter | null>(null);
  if (!adapterRef.current) {
    adapterRef.current = createLocalWorkspaceAdapter();
  }

  const { theme, toggleTheme, setTheme } = useThemeMode();

  const [workspace, setWorkspace] = useState<WorkspaceState>(() => createWorkspace());
  const [content, setContentState] = useState("");
  const [selection, setSelection] = useState<SelectionRange | null>(null);
  const [status, setStatus] = useState<"loading" | "ready">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [historyState, setHistoryState] = useState<HistoryState>({
    stack: [""],
    index: 0,
  });

  const projectLoading = status === "loading";
  const authLoading = false;

  const activeDocument = useMemo(() => getActiveDocument(workspace), [workspace]);
  const documents = useMemo(() => getSortedDocuments(workspace), [workspace]);
  const recentDocuments = useMemo(() => getRecentDocuments(workspace), [workspace]);

  const project = useMemo<ProjectView>(
    () => ({
      id: activeDocument.id,
      title: activeDocument.title,
      blocks: [{ id: activeDocument.id, content }],
    }),
    [activeDocument.id, activeDocument.title, content]
  );

  const commitContent = useCallback((nextContent: string) => {
    setContentState(nextContent);
    setWorkspace((current) =>
      updateDocumentContent(current, current.activeDocumentId, nextContent)
    );
    setHistoryState((current) => {
      const truncated = current.stack.slice(0, current.index + 1);
      if (truncated[truncated.length - 1] === nextContent) {
        return {
          stack: truncated,
          index: truncated.length - 1,
        };
      }

      const nextStack = clampHistory([...truncated, nextContent]);
      return {
        stack: nextStack,
        index: nextStack.length - 1,
      };
    });
    setSelection(null);
  }, []);

  const setContent = useCallback(
    (nextContent: string) => {
      commitContent(nextContent);
    },
    [commitContent]
  );

  const replaceSelectedText = useCallback(
    (replacement: string, overrideSelection?: SelectionRange | null) => {
      const selectionRange = overrideSelection ?? selection;
      if (!selectionRange) {
        commitContent(replacement);
        return;
      }

      commitContent(replaceSelection(content, selectionRange, replacement));
    },
    [commitContent, content, selection]
  );

  const createNewDocument = useCallback(() => {
    const newDocument = createDocument({
      title: createUntitledDocumentTitle(workspace.documents),
    });

    setWorkspace((current) => ({
      ...current,
      documents: [newDocument, ...current.documents],
      activeDocumentId: newDocument.id,
      recentDocumentIds: [newDocument.id, ...current.recentDocumentIds.filter((id) => id !== newDocument.id)],
    }));
    setContentState("");
    setSelection(null);
    setHistoryState({ stack: [""], index: 0 });
  }, [workspace.documents]);

  const renameActiveDocument = useCallback((title: string) => {
    setWorkspace((current) => renameWorkspaceDocument(current, current.activeDocumentId, title));
  }, []);

  const duplicateActiveDocument = useCallback(() => {
    setWorkspace((current) => duplicateWorkspaceDocument(current, current.activeDocumentId));
  }, []);

  const deleteActiveDocument = useCallback(() => {
    setWorkspace((current) => removeDocument(current, current.activeDocumentId));
    setSelection(null);
  }, []);

  const selectDocument = useCallback((documentId: string) => {
    setWorkspace((current) => activateDocument(current, documentId));
  }, []);

  const undo = useCallback(() => {
    setHistoryState((current) => {
      if (current.index <= 0) {
        return current;
      }

      const nextIndex = current.index - 1;
      const nextContent = current.stack[nextIndex] ?? "";
      setContentState(nextContent);
      setWorkspace((workspaceState) =>
        updateDocumentContent(workspaceState, workspaceState.activeDocumentId, nextContent)
      );
      setSelection(null);
      return {
        ...current,
        index: nextIndex,
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistoryState((current) => {
      if (current.index >= current.stack.length - 1) {
        return current;
      }

      const nextIndex = current.index + 1;
      const nextContent = current.stack[nextIndex] ?? "";
      setContentState(nextContent);
      setWorkspace((workspaceState) =>
        updateDocumentContent(workspaceState, workspaceState.activeDocumentId, nextContent)
      );
      setSelection(null);
      return {
        ...current,
        index: nextIndex,
      };
    });
  }, []);

  const saveNow = useCallback(async () => {
    if (!adapterRef.current) return;

    setIsSaving(true);
    try {
      const snapshot = snapshotWorkspace(workspace, theme);
      await adapterRef.current.save(snapshot);
      setLastSavedAt(Date.now());
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save your workspace right now."
      );
    } finally {
      setIsSaving(false);
    }
  }, [theme, workspace]);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      try {
        const loadedWorkspace = await adapterRef.current!.load();
        if (!mounted) return;

        const normalized = snapshotWorkspace(loadedWorkspace, loadedWorkspace.theme);
        setWorkspace(normalized);
        const document = getActiveDocument(normalized);
        setContentState(document.content);
        setHistoryState({ stack: [document.content], index: 0 });
        setSelection(null);
        setTheme(normalized.theme);
        setStatus("ready");
      } catch (error) {
        if (!mounted) return;

        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load your workspace."
        );
        const fallback = createWorkspace();
        setWorkspace(fallback);
        setContentState(fallback.documents[0]?.content ?? "");
        setHistoryState({ stack: [""], index: 0 });
        setStatus("ready");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [setTheme]);

  useEffect(() => {
    if (status !== "ready") return;

    setWorkspace((current) =>
      current.theme === theme ? current : { ...current, theme }
    );
  }, [theme, status]);

  useEffect(() => {
    if (status !== "ready") return;

    const snapshot = snapshotWorkspace(workspace, theme);
    setIsSaving(true);

    const timeout = window.setTimeout(() => {
      void (async () => {
        try {
          await adapterRef.current?.save(snapshot);
          setLastSavedAt(Date.now());
          setErrorMessage(null);
        } catch (error) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to autosave your workspace."
          );
        } finally {
          setIsSaving(false);
        }
      })();
    }, 450);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [status, theme, workspace]);

  useEffect(() => {
    if (activeDocument.id !== workspace.activeDocumentId) {
      return;
    }

    setContentState(activeDocument.content);
    setHistoryState({ stack: [activeDocument.content], index: 0 });
  }, [activeDocument.content, activeDocument.id, workspace.activeDocumentId]);

  const clearError = useCallback(() => {
    setErrorMessage(null);
  }, []);

  return {
    project,
    workspace,
    activeDocument,
    documents,
    recentDocuments,
    content,
    selection,
    authLoading,
    projectLoading,
    status,
    errorMessage,
    isSaving,
    lastSavedAt,
    canUndo: historyState.index > 0,
    canRedo: historyState.index < historyState.stack.length - 1,
    isFullscreen,
    theme,
    setSelection,
    setContent,
    replaceSelectedText,
    createNewDocument,
    renameActiveDocument,
    duplicateActiveDocument,
    deleteActiveDocument,
    selectDocument,
    undo,
    redo,
    saveNow,
    toggleFullscreen: () => setIsFullscreen((current) => !current),
    toggleTheme,
    setTheme,
    clearError,
  };
}
