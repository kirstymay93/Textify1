import { memo, useState } from "react";
import { Clock, Eye, Download, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface HistorySnapshot {
  id: string;
  timestamp: number;
  name: string;
  thumbnail?: string;
}

interface ProjectOverviewProps {
  projectTitle: string;
  lastSavedAt: number | null;
  history: HistorySnapshot[];
  onSnapshotSelect: (snapshotId: string) => void;
  onExport: () => void;
  onShare: () => void;
}

export const ProjectOverview = memo(function ProjectOverview({
  projectTitle,
  lastSavedAt,
  history,
  onSnapshotSelect,
  onExport,
  onShare,
}: ProjectOverviewProps) {
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex flex-col h-full bg-background border-r border-border">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border">
        <h2 className="text-sm font-semibold text-foreground truncate">{projectTitle}</h2>
        {lastSavedAt && (
          <p className="text-xs text-muted-foreground mt-1">
            Saved {formatTime(lastSavedAt)}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-3 border-b border-border space-y-2">
        <Button
          onClick={onShare}
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 text-xs"
        >
          <Share2 className="w-3 h-3" />
          Share
        </Button>
        <Button
          onClick={onExport}
          size="sm"
          className="w-full justify-start gap-2 text-xs"
        >
          <Download className="w-3 h-3" />
          Export
        </Button>
      </div>

      {/* History Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-3">
          <h3 className="text-xs font-semibold text-foreground mb-3 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            History
          </h3>

          {history.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-8">
              No edits yet
            </p>
          ) : (
            <div className="space-y-2">
              {history.map((snapshot) => (
                <button
                  key={snapshot.id}
                  onClick={() => {
                    setSelectedSnapshotId(snapshot.id);
                    onSnapshotSelect(snapshot.id);
                  }}
                  className={cn(
                    "w-full p-2 rounded text-left transition-colors text-xs",
                    selectedSnapshotId === snapshot.id
                      ? "bg-foreground text-background"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  )}
                >
                  <div className="flex items-center gap-2">
                    {snapshot.thumbnail && (
                      <img
                        src={snapshot.thumbnail}
                        alt={snapshot.name}
                        className="w-8 h-8 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{snapshot.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {formatTime(snapshot.timestamp)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-4 py-3 border-t border-border text-xs text-muted-foreground">
        <p className="flex items-center gap-1">
          <Eye className="w-3 h-3" />
          {history.length} version{history.length !== 1 ? "s" : ""}
        </p>
      </div>
    </div>
  );
});

ProjectOverview.displayName = "ProjectOverview";
