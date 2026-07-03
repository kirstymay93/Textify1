export function EditorSidebar() {
  return (
    <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-border/50 bg-card/40 backdrop-blur-sm flex flex-col overflow-hidden shrink-0 max-h-[40vh] lg:max-h-none">
      
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50 shrink-0">
        <p className="text-xs font-semibold text-foreground">
          Properties
        </p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Select a block to edit
        </p>
      </div>

      {/* Empty state */}
      <div className="flex-1 flex items-center justify-center text-center p-4">
        <div>
          <p className="text-sm text-muted-foreground">
            No block selected
          </p>
        </div>
      </div>

    </aside>
  );
}

export default EditorSidebar;