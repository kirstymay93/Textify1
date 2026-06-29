interface EditorHeaderProps {
  project: any;
}

export function EditorHeader({ project }: EditorHeaderProps) {
  return (
    <header className="flex items-center justify-between px-5 py-3 border-b border-border/50 bg-card/60 backdrop-blur-sm shrink-0 z-20">
      <div className="flex items-center gap-3">
        <div className="text-sm font-medium text-foreground">
          {project?.title || 'Untitled Project'}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <p className="text-xs text-muted-foreground">Ready</p>
      </div>
    </header>
  );
}
