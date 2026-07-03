import { Button } from "@/components/ui/button";

type Project = {
  id?: string;
  title?: string;
};

interface EditorHeaderProps {
  project: Project;
}

export function EditorHeader({ project }: EditorHeaderProps) {
  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-4 bg-background">
      <div className="flex items-center gap-2">
        <h1 className="text-sm font-medium">
          {project?.title ?? "Untitled Document"}
        </h1>
      </div>

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
}

export default EditorHeader;