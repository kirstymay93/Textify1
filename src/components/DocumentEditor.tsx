import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useDocumentEditor, DOCUMENT_EDITOR_URL } from "@/hooks/useDocumentEditor";
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      openFromFile(file, false);
    }
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  const handleOpenUrl = () => {
    const trimmedUrl = urlInput.trim();
    const trimmedName = fileNameInput.trim() || trimmedUrl.split("/").pop() || "document.docx";
    if (!trimmedUrl) return;
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
    <div className="h-full flex flex-col bg-background">
      {/* Toolbar */}
      <div className="h-12 border-b border-border flex items-center gap-2 px-4 shrink-0 flex-wrap">
        {/* Open from file */}
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

        {/* Open from URL toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowUrlPanel((v) => !v)}
          title="Open a document from a URL"
        >
          Open URL
        </Button>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Save */}
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
            className="h-8 text-xs border border-border rounded-md px-1 bg-background"
            value={saveFormat}
            onChange={(e) => setSaveFormat(e.target.value as SaveFormat)}
          >
            <option value="DOCX">DOCX</option>
            <option value="XLSX">XLSX</option>
            <option value="PPTX">PPTX</option>
            <option value="CSV">CSV</option>
          </select>
        </div>

        <div className="w-px h-5 bg-border mx-1" />

        {/* Read-only toggle */}
        <Button
          variant="outline"
          size="sm"
          disabled={!state.hasDocument}
          onClick={() => setReadonly(!state.readonly)}
          title={state.readonly ? "Switch to edit mode" : "Switch to read-only mode"}
        >
          {state.readonly ? "Edit Mode" : "Read-Only"}
        </Button>

        {/* Status badge */}
        <span className={cn("ml-auto text-xs font-medium", statusColor)}>
          {state.errorMessage ?? STATUS_LABELS[state.status] ?? state.status}
        </span>
      </div>

      {/* URL input panel */}
      {showUrlPanel && (
        <div className="border-b border-border bg-card/60 px-4 py-3 flex flex-wrap items-end gap-3 shrink-0">
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <label className="text-[11px] font-medium text-muted-foreground">
              Document URL
            </label>
            <input
              type="url"
              placeholder="https://example.com/file.docx"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleOpenUrl()}
              className="h-8 px-3 text-sm border border-border rounded-md bg-background outline-none focus:ring-1 focus:ring-black"
            />
          </div>
          <div className="flex flex-col gap-1 w-48">
            <label className="text-[11px] font-medium text-muted-foreground">
              File name (optional)
            </label>
            <input
              type="text"
              placeholder="document.docx"
              value={fileNameInput}
              onChange={(e) => setFileNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleOpenUrl()}
              className="h-8 px-3 text-sm border border-border rounded-md bg-background outline-none focus:ring-1 focus:ring-black"
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

      {/* iframe */}
      <div className="flex-1 relative overflow-hidden">
        {/* Overlay shown while the editor is first loading */}
        {state.status === "loading" && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80">
            <p className="text-sm text-muted-foreground animate-pulse">
              Loading document editor…
            </p>
          </div>
        )}
        <iframe
          ref={iframeRef}
          src={`${DOCUMENT_EDITOR_URL}/?embed=1`}
          title="Document Editor"
          className="w-full h-full border-0"
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </div>
  );
}
