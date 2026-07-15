import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DOCUMENT_EDITOR_URL,
  useDocumentEditor,
} from "@/hooks/useDocumentEditor";
import { cn } from "@/lib/utils";

type SaveFormat = "DOCX" | "XLSX" | "PPTX" | "CSV";

const STATUS_LABELS: Record<string, string> = {
  idle: "Idle",
  loading: "Loading…",
  ready: "Ready — open a document to begin",
  opened: "Document open",
  saving: "Saving…",
  error: "Error",
};

export default function DocumentEditor() {
  const { iframeRef, state, openFromUrl, openFromFile, save, setReadonly } =
    useDocumentEditor();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");
  const [fileNameInput, setFileNameInput] = useState("");
  const [saveFormat, setSaveFormat] = useState<SaveFormat>("DOCX");
  const [showUrlPanel, setShowUrlPanel] = useState(false);

  const iframeSrc = useMemo(() => {
    const url = new URL(DOCUMENT_EDITOR_URL, window.location.origin);
    url.searchParams.set("embed", "1");
    return url.toString();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      openFromFile(file, false);
    }

    e.target.value = "";
  };

  const handleOpenUrl = () => {
    const trimmedUrl = urlInput.trim();
    if (!trimmedUrl) return;

    let inferredName = "document.docx";
    try {
      const parsed = new URL(trimmedUrl);
      inferredName = parsed.pathname.split("/").filter(Boolean).pop() || inferredName;
    } catch {
      // The hook performs final URL validation and will surface an error.
    }

    const trimmedName = fileNameInput.trim() || inferredName;

    openFromUrl(trimmedUrl, trimmedName, false);
    setShowUrlPanel(false);
    setUrlInput("");
    setFileNameInput("");
  };

  const statusColor =
    state.status === "error"
      ? "text-red-500"
      : state.status === "opened"
      ? "text-green-600"
      : "text-muted-foreground";

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border px-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,.doc,.xlsx,.xls,.pptx,.ppt,.csv"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          title="Open a local file (DOCX, XLSX, PPTX, CSV)"
        >
          Open File
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowUrlPanel((value) => !value)}
          title="Open a document from a URL"
        >
          Open URL
        </Button>

        <div className="mx-1 h-5 w-px bg-border" />

        <div className="flex items-center gap-1">
          <Button
            size="sm"
            disabled={!state.hasDocument || state.status === "saving"}
            onClick={() => save(saveFormat)}
            title={`Save as ${saveFormat}`}
          >
            {state.status === "saving" ? "Saving…" : `Save as ${saveFormat}`}
          </Button>
          <select
            className="h-8 rounded-md border border-border bg-background px-1 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            value={saveFormat}
            onChange={(e) => setSaveFormat(e.target.value as SaveFormat)}
            aria-label="Save format"
          >
            <option value="DOCX">DOCX</option>
            <option value="XLSX">XLSX</option>
            <option value="PPTX">PPTX</option>
            <option value="CSV">CSV</option>
          </select>
        </div>

        <div className="mx-1 h-5 w-px bg-border" />

        <Button
          variant="outline"
          size="sm"
          disabled={!state.hasDocument}
          onClick={() => setReadonly(!state.readonly)}
          title={state.readonly ? "Switch to edit mode" : "Switch to read-only mode"}
        >
          {state.readonly ? "Edit Mode" : "Read-Only"}
        </Button>

        <span
          className={cn("ml-auto text-xs font-medium", statusColor)}
          role="status"
          aria-live="polite"
        >
          {state.errorMessage ?? STATUS_LABELS[state.status] ?? state.status}
        </span>
      </div>

      {showUrlPanel && (
        <div className="flex shrink-0 flex-wrap items-end gap-3 border-b border-border bg-card/60 px-4 py-3">
          <div className="flex min-w-[220px] flex-1 flex-col gap-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              Document URL
            </label>
            <input
              type="url"
              placeholder="https://example.com/file.docx"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleOpenUrl()}
              className="h-8 rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="Document URL"
            />
          </div>
          <div className="flex w-48 flex-col gap-1">
            <label className="text-[11px] font-medium text-muted-foreground">
              File name (optional)
            </label>
            <input
              type="text"
              placeholder="document.docx"
              value={fileNameInput}
              onChange={(e) => setFileNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleOpenUrl()}
              className="h-8 rounded-md border border-border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              aria-label="File name"
            />
          </div>
          <Button size="sm" onClick={handleOpenUrl} disabled={!urlInput.trim()}>
            Open
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowUrlPanel(false)}
          >
            Cancel
          </Button>
        </div>
      )}

      <div className="relative min-h-0 flex-1 overflow-hidden">
        {state.status === "loading" && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
            <p className="animate-pulse text-sm text-muted-foreground">
              Loading document editor…
            </p>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          title="Document Editor"
          className="h-full w-full border-0"
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </div>
  );
}
