import { memo } from "react";
import { Link } from "wouter";
import { Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EditorHeaderProps {
  project: { id: string; title: string };
  isSaving: boolean;
}

export const EditorHeader = memo(function EditorHeader({
  project,
  isSaving,
}: EditorHeaderProps) {
  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-background">
      <div className="flex items-center gap-2">
        <Link href="/editor">
          <a className="text-base font-bold text-foreground mr-4">Textify</a>
        </Link>
        <h1 className="text-lg font-semibold text-foreground flex-1 truncate">
          {project?.title || "Untitled Project"}
        </h1>
      </div>

      {isSaving && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground animate-pulse">
          <Save className="w-4 h-4" />
          <span>Saving...</span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          Share
        </Button>

        <Button size="sm">
          Export
        </Button>
      </div>
    </header>
  );
});

EditorHeader.displayName = "EditorHeader";
