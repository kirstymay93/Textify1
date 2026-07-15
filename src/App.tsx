import { Suspense, lazy, useEffect } from "react";
import { Link, useLocation } from "wouter";
import Editor from "@/components/Editor";
import { cn } from "@/lib/utils";

const DocumentEditor = lazy(() => import("@/components/DocumentEditor"));

type Tab = {
  label: string;
  path: string;
};

const TABS: Tab[] = [
  { label: "Text Editor", path: "/editor" },
  { label: "Documents", path: "/documents" },
];

function NavBar({ location }: { location: string }) {
  return (
    <nav
      aria-label="Primary"
      className="flex h-10 shrink-0 items-center gap-1 border-b border-border bg-background px-4"
    >
      <span className="mr-4 text-sm font-semibold">Textify</span>
      {TABS.map((tab) => {
        const isActive = location.startsWith(tab.path);

        return (
          <Link
            key={tab.path}
            href={tab.path}
            className={cn(
              "rounded-md px-3 py-1 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              isActive
                ? "bg-black text-white"
                : "text-muted-foreground hover:bg-muted"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default function App() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (location === "/" || location === "/1") {
      setLocation("/editor");
    }
  }, [location, setLocation]);

  const content = location.startsWith("/documents") ? (
    <Suspense
      fallback={
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <DocumentEditor />
    </Suspense>
  ) : (
    <Editor />
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <NavBar location={location} />

      <div className="min-h-0 flex-1 overflow-hidden">{content}</div>
    </div>
  );
}
