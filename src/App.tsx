import { useEffect, lazy, Suspense } from "react";
import { useLocation, Link } from "wouter";
import Editor from "@/components/Editor";
import { cn } from "@/lib/utils";

// Lazy-load the heavy DocumentEditor so the main editor bundle stays small
const DocumentEditor = lazy(() => import("@/components/DocumentEditor"));

type Tab = { label: string; path: string };

const TABS: Tab[] = [
  { label: "Text Editor", path: "/editor" },
  { label: "Documents", path: "/documents" },
];

function NavBar({ location }: { location: string }) {
  return (
    <nav className="h-10 border-b border-border bg-background flex items-center px-4 gap-1 shrink-0">
      <span className="text-sm font-semibold mr-4">Textify</span>
      {TABS.map((tab) => (
        <Link key={tab.path} href={tab.path}>
          <a
            className={cn(
              "px-3 py-1 rounded-md text-sm transition-colors",
              location.startsWith(tab.path)
                ? "bg-black text-white"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {tab.label}
          </a>
        </Link>
      ))}
    </nav>
  );
}

export default function App() {
  const [location, setLocation] = useLocation();

  // Redirect root to the text editor
  useEffect(() => {
    if (location === "/" || location === "/1") {
      setLocation("/editor");
    }
  }, [location, setLocation]);

  if (location === "/" || location === "/1") return null;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <NavBar location={location} />

      <div className="flex-1 overflow-hidden">
        {location.startsWith("/editor") && <Editor />}

        {location.startsWith("/documents") && (
          <Suspense
            fallback={
              <div className="h-full flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Loading…</p>
              </div>
            }
          >
            <DocumentEditor />
          </Suspense>
        )}
      </div>
    </div>
  );
}