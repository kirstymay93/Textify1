export function EditorSidebar() {
  return (
    <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-border/50 bg-card/40 backdrop-blur-sm flex flex-col overflow-hidden shrink-0 max-h-[40vh] lg:max-h-none">
      <div className="px-4 py-3 border-b border-border/50 shrink-0">
        <p className="text-xs font-semibold text-foreground">Properties</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">Select a layer to edit</p>
      </div>
      <div className="flex-1 flex items-center justify-center text-center">
        <div>
          <p className="text-sm text-muted-foreground">No layer selected</p>
        </div>
      </div>
    </aside>
  );
}
