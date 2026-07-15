export type ThemeMode = "light" | "dark";

export type AiAction =
  | "improve"
  | "rewrite"
  | "grammar"
  | "summarize"
  | "expand"
  | "shorten"
  | "tone"
  | "translate"
  | "continue";

export type AiTarget = "selection" | "document";

export interface AiActionOptions {
  tone?: string;
  language?: string;
}

export interface AiRequestBody {
  action: AiAction;
  text: string;
  options?: AiActionOptions;
}

export interface AiResponseBody {
  action: AiAction;
  transformedText: string;
  target: AiTarget;
}

export interface SelectionRange {
  start: number;
  end: number;
  text: string;
}

export interface WritingDocument {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  lastOpenedAt: number;
}

export interface WorkspaceState {
  documents: WritingDocument[];
  activeDocumentId: string;
  recentDocumentIds: string[];
  theme: ThemeMode;
}

export interface EditorMetrics {
  wordCount: number;
  characterCount: number;
  readingTimeMinutes: number;
}

export interface AiPromptBundle {
  systemPrompt: string;
  userPrompt: string;
  target: AiTarget;
}

export const AI_ACTION_ORDER: AiAction[] = [
  "improve",
  "rewrite",
  "grammar",
  "summarize",
  "expand",
  "shorten",
  "tone",
  "translate",
  "continue",
];

export const AI_ACTION_LABELS: Record<AiAction, string> = {
  improve: "Improve Writing",
  rewrite: "Rewrite",
  grammar: "Fix Grammar",
  summarize: "Summarize",
  expand: "Expand",
  shorten: "Shorten",
  tone: "Change Tone",
  translate: "Translate",
  continue: "Continue Writing",
};

export const AI_ACTION_DESCRIPTIONS: Record<AiAction, string> = {
  improve: "Polish clarity, flow, and tone without changing meaning.",
  rewrite: "Rework the text while preserving the original intent.",
  grammar: "Correct grammar, spelling, punctuation, and agreement.",
  summarize: "Compress the writing into a concise summary.",
  expand: "Add detail, examples, or context while staying faithful.",
  shorten: "Trim the text to the essentials without losing meaning.",
  tone: "Shift the tone to match the selected style.",
  translate: "Translate the writing into the selected language.",
  continue: "Continue the writing in the same style and voice.",
};

export const AI_TONE_OPTIONS = [
  "Professional",
  "Friendly",
  "Confident",
  "Concise",
  "Persuasive",
  "Warm",
  "Formal",
  "Conversational",
] as const;

const AI_SYSTEM_PROMPT =
  "You are Textify1, a careful writing assistant. Return only the transformed text. Preserve meaning unless the action explicitly asks for compression, expansion, translation, or continuation. Keep formatting and line breaks intact when practical. Never add commentary, bullets, labels, or code fences unless they are part of the requested output.";

const FALLBACK_TITLE = "Untitled document";

export function createDocument(overrides: Partial<WritingDocument> = {}): WritingDocument {
  const now = Date.now();
  return {
    id: overrides.id ?? createId(),
    title: overrides.title?.trim() || FALLBACK_TITLE,
    content: overrides.content ?? "",
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
    lastOpenedAt: overrides.lastOpenedAt ?? now,
  };
}

export function createWorkspace(
  documentCount = 1,
  theme: ThemeMode = "dark"
): WorkspaceState {
  const documents = Array.from({ length: Math.max(1, documentCount) }, (_, index) =>
    createDocument({ title: index === 0 ? FALLBACK_TITLE : `${FALLBACK_TITLE} ${index + 1}` })
  );

  return {
    documents,
    activeDocumentId: documents[0].id,
    recentDocumentIds: documents.map((document) => document.id),
    theme,
  };
}

export function normalizeWorkspace(candidate: unknown): WorkspaceState {
  if (!candidate || typeof candidate !== "object") {
    return createWorkspace();
  }

  const value = candidate as Partial<WorkspaceState> & {
    documents?: unknown;
    activeDocumentId?: unknown;
    recentDocumentIds?: unknown;
    theme?: unknown;
  };

  const documents = Array.isArray(value.documents)
    ? value.documents
        .map((document, index) => normalizeDocument(document, index))
        .filter((document): document is WritingDocument => Boolean(document))
    : [];

  const normalizedDocuments = documents.length > 0 ? documents : createWorkspace().documents;
  const activeDocumentId =
    typeof value.activeDocumentId === "string" &&
    normalizedDocuments.some((document) => document.id === value.activeDocumentId)
      ? value.activeDocumentId
      : normalizedDocuments[0].id;

  const recentDocumentIds = normalizeDocumentIdList(
    value.recentDocumentIds,
    normalizedDocuments.map((document) => document.id),
    activeDocumentId
  );

  const theme = value.theme === "light" || value.theme === "dark" ? value.theme : "dark";

  return {
    documents: normalizedDocuments,
    activeDocumentId,
    recentDocumentIds,
    theme,
  };
}

export function normalizeDocument(
  candidate: unknown,
  index = 0
): WritingDocument | null {
  if (!candidate || typeof candidate !== "object") {
    return createDocument({ title: index === 0 ? FALLBACK_TITLE : `${FALLBACK_TITLE} ${index + 1}` });
  }

  const value = candidate as Partial<WritingDocument>;
  const id = typeof value.id === "string" && value.id.trim().length > 0 ? value.id : createId();
  const now = Date.now();

  return {
    id,
    title:
      typeof value.title === "string" && value.title.trim().length > 0
        ? value.title.trim()
        : index === 0
          ? FALLBACK_TITLE
          : `${FALLBACK_TITLE} ${index + 1}`,
    content: typeof value.content === "string" ? value.content : "",
    createdAt: typeof value.createdAt === "number" ? value.createdAt : now,
    updatedAt: typeof value.updatedAt === "number" ? value.updatedAt : now,
    lastOpenedAt: typeof value.lastOpenedAt === "number" ? value.lastOpenedAt : now,
  };
}

export function getActiveDocument(workspace: WorkspaceState): WritingDocument {
  return (
    workspace.documents.find((document) => document.id === workspace.activeDocumentId) ??
    workspace.documents[0] ??
    createDocument()
  );
}

export function getSortedDocuments(workspace: WorkspaceState): WritingDocument[] {
  const activeId = workspace.activeDocumentId;
  const recentRank = new Map<string, number>();

  workspace.recentDocumentIds.forEach((id, index) => {
    recentRank.set(id, index);
  });

  return [...workspace.documents].sort((left, right) => {
    if (left.id === activeId) return -1;
    if (right.id === activeId) return 1;

    const leftRank = recentRank.get(left.id) ?? Number.MAX_SAFE_INTEGER;
    const rightRank = recentRank.get(right.id) ?? Number.MAX_SAFE_INTEGER;

    if (leftRank !== rightRank) return leftRank - rightRank;
    return right.lastOpenedAt - left.lastOpenedAt;
  });
}

export function getRecentDocuments(workspace: WorkspaceState): WritingDocument[] {
  const sortedByRecency = [...workspace.documents].sort(
    (left, right) => right.lastOpenedAt - left.lastOpenedAt
  );

  return sortedByRecency.slice(0, 6);
}

export function createUntitledDocumentTitle(documents: WritingDocument[]): string {
  const count = documents.filter((document) => document.title.startsWith(FALLBACK_TITLE)).length;
  return count <= 1 ? FALLBACK_TITLE : `${FALLBACK_TITLE} ${count + 1}`;
}

export function renameDocument(
  workspace: WorkspaceState,
  documentId: string,
  title: string
): WorkspaceState {
  const nextTitle = title.trim() || FALLBACK_TITLE;
  return {
    ...workspace,
    documents: workspace.documents.map((document) =>
      document.id === documentId
        ? { ...document, title: nextTitle, updatedAt: Date.now() }
        : document
    ),
  };
}

export function duplicateDocument(
  workspace: WorkspaceState,
  documentId: string
): WorkspaceState {
  const source = workspace.documents.find((document) => document.id === documentId);
  if (!source) return workspace;

  const copy = createDocument({
    title: `${source.title} Copy`,
    content: source.content,
  });

  return {
    ...workspace,
    documents: [copy, ...workspace.documents],
    activeDocumentId: copy.id,
    recentDocumentIds: uniqueIds([copy.id, documentId, ...workspace.recentDocumentIds]),
  };
}

export function deleteDocument(
  workspace: WorkspaceState,
  documentId: string
): WorkspaceState {
  if (workspace.documents.length <= 1) {
    return createWorkspace();
  }

  const remaining = workspace.documents.filter((document) => document.id !== documentId);
  const fallbackActive =
    workspace.recentDocumentIds.find((id) => id !== documentId && remaining.some((document) => document.id === id)) ??
    remaining[0].id;

  return {
    ...workspace,
    documents: remaining,
    activeDocumentId: fallbackActive,
    recentDocumentIds: uniqueIds([fallbackActive, ...workspace.recentDocumentIds.filter((id) => id !== documentId)]),
  };
}

export function updateDocumentContent(
  workspace: WorkspaceState,
  documentId: string,
  content: string
): WorkspaceState {
  const now = Date.now();

  return {
    ...workspace,
    documents: workspace.documents.map((document) =>
      document.id === documentId
        ? { ...document, content, updatedAt: now }
        : document
    ),
  };
}

export function activateDocument(
  workspace: WorkspaceState,
  documentId: string
): WorkspaceState {
  if (!workspace.documents.some((document) => document.id === documentId)) {
    return workspace;
  }

  const now = Date.now();
  return {
    ...workspace,
    activeDocumentId: documentId,
    recentDocumentIds: uniqueIds([documentId, ...workspace.recentDocumentIds.filter((id) => id !== documentId)]),
    documents: workspace.documents.map((document) =>
      document.id === documentId
        ? { ...document, lastOpenedAt: now }
        : document
    ),
  };
}

export function createSelectionRange(
  text: string,
  start: number,
  end: number
): SelectionRange | null {
  const normalizedStart = Math.max(0, Math.min(start, end));
  const normalizedEnd = Math.max(0, Math.max(start, end));

  if (normalizedStart === normalizedEnd) {
    return null;
  }

  return {
    start: normalizedStart,
    end: normalizedEnd,
    text: text.slice(normalizedStart, normalizedEnd),
  };
}

export function replaceSelection(text: string, selection: SelectionRange, replacement: string): string {
  return text.slice(0, selection.start) + replacement + text.slice(selection.end);
}

export function calculateMetrics(text: string): EditorMetrics {
  const normalized = text.trim();
  const wordCount = normalized.length === 0 ? 0 : normalized.split(/\s+/).filter(Boolean).length;
  const characterCount = text.length;
  const readingTimeMinutes = wordCount === 0 ? 0 : Math.max(1, Math.ceil(wordCount / 220));

  return {
    wordCount,
    characterCount,
    readingTimeMinutes,
  };
}

export function formatReadingTime(minutes: number): string {
  if (minutes <= 0) return "< 1 min read";
  return `${minutes} min read`;
}

export function buildAiPromptBundle(
  action: AiAction,
  text: string,
  options: AiActionOptions = {}
): AiPromptBundle {
  const label = AI_ACTION_LABELS[action];
  const toneText = options.tone?.trim();
  const languageText = options.language?.trim();
  const details =
    action === "tone"
      ? `Target tone: ${toneText || "Professional"}`
      : action === "translate"
        ? `Target language: ${languageText || "English"}`
        : "";

  const userPrompt = [
    `Action: ${label}`,
    details,
    "",
    "Text to transform:",
    "```",
    text,
    "```",
    "",
    "Return only the transformed text.",
  ]
    .filter((part) => part !== "")
    .join("\n");

  return {
    systemPrompt: AI_SYSTEM_PROMPT,
    userPrompt,
    target: text.length > 0 ? "selection" : "document",
  };
}

function normalizeDocumentIdList(
  candidate: unknown,
  fallbackIds: string[],
  activeDocumentId: string
): string[] {
  const ids = Array.isArray(candidate)
    ? candidate.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    : [];

  return uniqueIds([activeDocumentId, ...ids, ...fallbackIds]);
}

function uniqueIds(ids: string[]): string[] {
  return Array.from(new Set(ids.filter((id) => id.trim().length > 0)));
}

function createId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `doc-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
