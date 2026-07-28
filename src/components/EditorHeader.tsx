import { memo } from "react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SaveIcon } from "@/components/icons";

interface EditorHeaderProps {
  project: { id: string; title: string };
  isSaving: boolean;
}

export const EditorHeader = memo(function EditorHeader({
  project,
  isSaving,
}: EditorHeaderProps) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4">
      <div className="flex min-w-0 items-center gap-2">
        <Link href="/editor">
          <a className="mr-4 text-base font-bold text-foreground">Textify</a>
        </Link>
        <h1 className="min-w-0 flex-1 truncate text-lg font-semibold text-foreground">
          {project?.title || "Untitled Project"}
        </h1>
      </div>

      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex items-center gap-1 text-sm text-muted-foreground transition-opacity",
            isSaving ? "opacity-100" : "opacity-0"
          )}
          aria-live="polite"
        >
          <SaveIcon className="h-4 w-4" />
          <span>{isSaving ? "Saving..." : "Saved"}</span>
        </div>

        <Button variant="outline" size="sm" type="button">
          Share
        </Button>

        <Button size="sm" type="button">
          Export
        </Button>
      </div>
    </header>
  );
});

EditorHeader.displayName = "EditorHeader";
