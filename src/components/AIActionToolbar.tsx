import { useMemo, useState, type ReactNode } from "react";
import {
  AI_ACTION_DESCRIPTIONS,
  AI_ACTION_LABELS,
  AI_ACTION_ORDER,
  AI_TONE_OPTIONS,
  type AiAction,
  type AiActionOptions,
} from "@/lib/editorUtils";
import { cn } from "@/lib/utils";
import {
  ContinueIcon,
  ExpandIcon,
  GrammarIcon,
  RewriteIcon,
  ShortenIcon,
  SparklesIcon,
  SummarizeIcon,
  ToneIcon,
  TranslateIcon,
} from "@/components/icons";
import { Button } from "@/components/ui/button";

interface AIActionToolbarProps {
  loadingAction: AiAction | null;
  disabled?: boolean;
  onRunAction: (action: AiAction, options?: AiActionOptions) => Promise<void>;
}

const BUTTON_ICON_SIZE = "h-4 w-4";

const ACTION_ICONS: Record<AiAction, ReactNode> = {
  improve: <SparklesIcon className={BUTTON_ICON_SIZE} />,
  rewrite: <RewriteIcon className={BUTTON_ICON_SIZE} />,
  grammar: <GrammarIcon className={BUTTON_ICON_SIZE} />,
  summarize: <SummarizeIcon className={BUTTON_ICON_SIZE} />,
  expand: <ExpandIcon className={BUTTON_ICON_SIZE} />,
  shorten: <ShortenIcon className={BUTTON_ICON_SIZE} />,
  tone: <ToneIcon className={BUTTON_ICON_SIZE} />,
  translate: <TranslateIcon className={BUTTON_ICON_SIZE} />,
  continue: <ContinueIcon className={BUTTON_ICON_SIZE} />,
};

const ACTION_HINTS: Record<AiAction, string> = {
  improve: "Refine clarity and flow.",
  rewrite: "Rewrite without changing meaning.",
  grammar: "Fix grammar and punctuation.",
  summarize: "Condense the content.",
  expand: "Add useful detail.",
  shorten: "Make it more concise.",
  tone: "Choose a tone.",
  translate: "Pick a target language.",
  continue: "Keep writing naturally.",
};

export function AIActionToolbar({ loadingAction, disabled = false, onRunAction }: AIActionToolbarProps) {
  const [openAction, setOpenAction] = useState<AiAction | null>(null);
  const [tone, setTone] = useState<(typeof AI_TONE_OPTIONS)[number]>("Professional");
  const [language, setLanguage] = useState("Spanish");

  const advancedAction = useMemo(() => openAction === "tone" || openAction === "translate", [openAction]);

  const handleAction = async (action: AiAction) => {
    if (action === "tone" || action === "translate") {
      setOpenAction(action);
      return;
    }

    setOpenAction(null);
    await onRunAction(action);
  };

  const handleSubmitAdvanced = async () => {
    if (!openAction) return;

    const options: AiActionOptions =
      openAction === "tone"
        ? { tone }
        : { language: language.trim() || "Spanish" };

    const action = openAction;
    setOpenAction(null);
    await onRunAction(action, options);
  };

  return (
    <section className="space-y-3 rounded-3xl border border-border/70 bg-card/80 p-3 shadow-sm backdrop-blur-xl md:p-4">
      <div className="flex flex-wrap items-center gap-2">
        {AI_ACTION_ORDER.map((action) => {
          const isLoading = loadingAction === action;
          return (
            <Button
              key={action}
              type="button"
              variant={action === openAction ? "default" : "outline"}
              size="sm"
              disabled={disabled || Boolean(loadingAction)}
              onClick={() => {
                void handleAction(action);
              }}
              className={cn(
                "gap-2 rounded-full px-3 transition-transform duration-200 hover:-translate-y-0.5",
                action === openAction && "shadow-md"
              )}
              title={AI_ACTION_DESCRIPTIONS[action]}
            >
              {isLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                ACTION_ICONS[action]
              )}
              <span className="whitespace-nowrap">{AI_ACTION_LABELS[action]}</span>
            </Button>
          );
        })}
      </div>

      {openAction ? (
        <div className="rounded-2xl border border-border bg-background/80 p-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">
                {AI_ACTION_LABELS[openAction]}
              </p>
              <p className="text-sm text-muted-foreground">
                {ACTION_HINTS[openAction]}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {openAction === "tone" ? (
                <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Tone
                  <select
                    className="h-10 min-w-[10rem] rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-foreground"
                    value={tone}
                    onChange={(event) => setTone(event.target.value as (typeof AI_TONE_OPTIONS)[number])}
                  >
                    {AI_TONE_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              {openAction === "translate" ? (
                <label className="flex flex-col gap-1 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Language
                  <input
                    type="text"
                    placeholder="Spanish"
                    className="h-10 min-w-[10rem] rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-foreground"
                    value={language}
                    onChange={(event) => setLanguage(event.target.value)}
                  />
                </label>
              ) : null}

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    void handleSubmitAdvanced();
                  }}
                  disabled={disabled || Boolean(loadingAction)}
                  className="gap-2 rounded-full"
                >
                  <SparklesIcon className="h-4 w-4" />
                  Apply
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setOpenAction(null)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Works on highlighted text or the full document.
      </p>
    </section>
  );
}

export default AIActionToolbar;
