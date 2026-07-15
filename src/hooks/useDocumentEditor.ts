import { useCallback, useEffect, useRef, useState } from "react";

const FALLBACK_DOCUMENT_EDITOR_URL = "http://localhost:5173";

function resolveDocumentEditorUrl(): string {
  const configuredUrl = import.meta.env.VITE_DOCUMENT_EDITOR_URL?.trim();
  const candidate = configuredUrl || FALLBACK_DOCUMENT_EDITOR_URL;

  try {
    return new URL(candidate, window.location.origin).toString();
  } catch {
    return FALLBACK_DOCUMENT_EDITOR_URL;
  }
}

export const DOCUMENT_EDITOR_URL = resolveDocumentEditorUrl();
export const DOCUMENT_EDITOR_ORIGIN = new URL(DOCUMENT_EDITOR_URL).origin;

export type DocEditorStatus =
  | "idle"
  | "loading"
  | "ready"
  | "opened"
  | "saving"
  | "error";

export interface DocEditorState {
  status: DocEditorStatus;
  hasDocument: boolean;
  readonly: boolean;
  errorMessage: string | null;
  lastSavedFile: File | null;
}

interface UseDocumentEditorReturn {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  state: DocEditorState;
  openFromUrl: (url: string, fileName: string, readonly?: boolean) => void;
  openFromFile: (file: File, readonly?: boolean) => void;
  save: (targetExt?: "DOCX" | "XLSX" | "PPTX" | "CSV") => void;
  setReadonly: (readonly: boolean) => void;
  getState: () => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isSafeHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function useDocumentEditor(): UseDocumentEditorReturn {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [state, setState] = useState<DocEditorState>({
    status: "loading",
    hasDocument: false,
    readonly: false,
    errorMessage: null,
    lastSavedFile: null,
  });

  const sendCommand = useCallback(
    (type: string, payload: Record<string, unknown> = {}) => {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) return;

      const id = generateId();
      iframe.contentWindow.postMessage(
        { id, type, payload },
        DOCUMENT_EDITOR_ORIGIN
      );
    },
    []
  );

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.origin !== DOCUMENT_EDITOR_ORIGIN) return;

      const { type, payload } = event.data || {};
      if (!type?.startsWith("document:")) return;

      switch (type) {
        case "document:ready":
          setState((prev) => ({ ...prev, status: "ready" }));
          break;

        case "document:opened":
          setState((prev) => ({
            ...prev,
            status: "opened",
            hasDocument: true,
            errorMessage: null,
          }));
          break;

        case "document:saved":
          setState((prev) => ({
            ...prev,
            status: "opened",
            lastSavedFile: payload?.file ?? null,
          }));

          if (payload?.file instanceof File) {
            const url = URL.createObjectURL(payload.file);
            const anchor = document.createElement("a");
            anchor.href = url;
            anchor.download = payload.file.name;
            anchor.click();
            URL.revokeObjectURL(url);
          }
          break;

        case "document:readonly-changed":
          setState((prev) => ({
            ...prev,
            readonly: payload?.readonly ?? prev.readonly,
          }));
          break;

        case "document:state":
          setState((prev) => ({
            ...prev,
            hasDocument: payload?.hasDocument ?? prev.hasDocument,
            readonly: payload?.readonly ?? prev.readonly,
          }));
          break;

        case "document:error":
          setState((prev) => ({
            ...prev,
            status: "error",
            errorMessage: payload?.message ?? "An unknown error occurred.",
          }));
          break;

        default:
          break;
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  const openFromUrl = useCallback(
    (url: string, fileName: string, readonly = false) => {
      if (!isSafeHttpUrl(url)) {
        setState((prev) => ({
          ...prev,
          status: "error",
          errorMessage: "Please enter a valid http or https URL.",
        }));
        return;
      }

      setState((prev) => ({ ...prev, status: "loading", errorMessage: null }));
      sendCommand("document:open-url", { url, fileName, readonly });
    },
    [sendCommand]
  );

  const openFromFile = useCallback(
    (file: File, readonly = false) => {
      setState((prev) => ({ ...prev, status: "loading", errorMessage: null }));
      sendCommand("document:open-file", { file, readonly });
    },
    [sendCommand]
  );

  const save = useCallback(
    (targetExt: "DOCX" | "XLSX" | "PPTX" | "CSV" = "DOCX") => {
      setState((prev) => ({ ...prev, status: "saving" }));
      sendCommand("document:save", { targetExt });
    },
    [sendCommand]
  );

  const setReadonly = useCallback(
    (readonly: boolean) => {
      sendCommand("document:set-readonly", { readonly });
    },
    [sendCommand]
  );

  const getState = useCallback(() => {
    sendCommand("document:get-state");
  }, [sendCommand]);

  return {
    iframeRef,
    state,
    openFromUrl,
    openFromFile,
    save,
    setReadonly,
    getState,
  };
}
