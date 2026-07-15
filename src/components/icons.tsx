import type { SVGProps } from "react";

function BaseIcon({ children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function SparklesIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M12 2l1.6 5.2L19 9l-5.4 1.8L12 16l-1.6-5.2L5 9l5.4-1.8L12 2Z" />
      <path d="M19 14l.9 2.9L23 18l-3.1 1.1L19 22l-.9-2.9L15 18l3.1-1.1L19 14Z" />
    </BaseIcon>
  );
}

export function RewriteIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M4 7h8" />
      <path d="M4 12h16" />
      <path d="M4 17h10" />
      <path d="M18 5l2 2-2 2" />
    </BaseIcon>
  );
}

export function GrammarIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M7 4h10" />
      <path d="M9 4v16" />
      <path d="M15 4v16" />
      <path d="m6 14 2 2 4-4" />
    </BaseIcon>
  );
}

export function SummarizeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M5 6h14" />
      <path d="M5 12h14" />
      <path d="M5 18h9" />
    </BaseIcon>
  );
}

export function ExpandIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M7 10V7h3" />
      <path d="M17 14v3h-3" />
      <path d="M7 7l4 4" />
      <path d="M13 13l4 4" />
    </BaseIcon>
  );
}

export function ShortenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M7 7h10" />
      <path d="M7 17h10" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
    </BaseIcon>
  );
}

export function ToneIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M6 8h12" />
      <path d="M6 12h8" />
      <path d="M6 16h10" />
    </BaseIcon>
  );
}

export function TranslateIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M4 5h8" />
      <path d="M8 3v2" />
      <path d="M6 7c1.6 4.4 5 7.6 9 9" />
      <path d="M14 5c-1.4 4.1-4.4 7.7-8 10" />
      <path d="M13 19l3-7 3 7" />
      <path d="M14 17h4" />
    </BaseIcon>
  );
}

export function ContinueIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M4 12h11" />
      <path d="M11 7l5 5-5 5" />
      <path d="M19 5v14" />
    </BaseIcon>
  );
}

export function DocumentIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M8 3h6l4 4v14H8z" />
      <path d="M14 3v5h5" />
      <path d="M10 12h6" />
      <path d="M10 16h6" />
    </BaseIcon>
  );
}

export function PlusIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </BaseIcon>
  );
}

export function DuplicateIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M9 9h11v11H9z" />
      <path d="M5 5h11v11" />
    </BaseIcon>
  );
}

export function TrashIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M4 7h16" />
      <path d="M9 7V5h6v2" />
      <path d="M8 7l1 13h6l1-13" />
    </BaseIcon>
  );
}

export function UndoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M9 9H5V5" />
      <path d="M5 9a9 9 0 1 1 3 6.7" />
    </BaseIcon>
  );
}

export function RedoIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M15 9h4V5" />
      <path d="M19 9a9 9 0 1 0-3 6.7" />
    </BaseIcon>
  );
}

export function FullscreenIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M8 3H3v5" />
      <path d="M16 3h5v5" />
      <path d="M21 16v5h-5" />
      <path d="M3 16v5h5" />
    </BaseIcon>
  );
}

export function ThemeIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M21 12.5A8.5 8.5 0 1 1 11.5 3a7 7 0 0 0 9.5 9.5Z" />
    </BaseIcon>
  );
}

export function SunIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </BaseIcon>
  );
}

export function MoonIcon(props: SVGProps<SVGSVGElement>) {
  return <ThemeIcon {...props} />;
}

export function CopyIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M9 9h11v11H9z" />
      <path d="M5 5h11v11" />
    </BaseIcon>
  );
}

export function SaveIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M5 4h11l3 3v13H5z" />
      <path d="M8 4v6h7V4" />
      <path d="M8 14h8" />
    </BaseIcon>
  );
}

export function OfflineIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <BaseIcon {...props}>
      <path d="M4 8a11 11 0 0 1 16 0" />
      <path d="M7 11a7 7 0 0 1 10 0" />
      <path d="M10 14a3 3 0 0 1 4 0" />
      <path d="M12 18h.01" />
    </BaseIcon>
  );
}
