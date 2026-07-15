import { useCallback, useRef, useState } from "react";
import type { AiAction, AiActionOptions, AiRequestBody, AiResponseBody, SelectionRange } from "@/lib/editorUtils";

interface WritingAssistantRequest {
  action: AiAction;
  text: string;
  selection: SelectionRange | null;
  options?: AiActionOptions;
}

interface AssistantState {
  loadingAction: AiAction | null;
  result: AiResponseBody | null;
  error: string | null;
  lastRequest: WritingAssistantRequest | null;
}

const DEFAULT_STATE: AssistantState = {
  loadingAction: null,
  result: null,
  error: null,
  lastRequest: null,
};

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { error?: { message?: string } } | { message?: string };
    if ("error" in data && data.error?.message) return data.error.message;
    if ("message" in data && data.message) return data.message;
  } catch {
    // fall through to status text
  }

  return response.statusText || "Request failed";
}

export function useWritingAssistant() {
  const abortControllerRef = useRef<AbortController | null>(null);
  const [state, setState] = useState<AssistantState>(DEFAULT_STATE);

  const clearResult = useCallback(() => {
    setState((current) => ({ ...current, result: null, error: null }));
  }, []);

  const runAction = useCallback(async (request: WritingAssistantRequest) => {
    setState((current) => ({
      ...current,
      loadingAction: request.action,
      error: null,
      lastRequest: request,
    }));

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const message = "You are offline. Reconnect and try again.";
      setState((current) => ({
        ...current,
        loadingAction: null,
        error: message,
      }));
      throw new Error(message);
    }

    const payload: AiRequestBody = {
      action: request.action,
      text: request.selection?.text || request.text,
      options: request.options,
    };

    const timeout = window.setTimeout(() => controller.abort(), 45000);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const data = (await response.json()) as AiResponseBody;
      setState((current) => ({
        ...current,
        loadingAction: null,
        result: data,
        error: null,
      }));

      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to process request.";
      setState((current) => ({
        ...current,
        loadingAction: null,
        error: message,
      }));
      throw error instanceof Error ? error : new Error(message);
    } finally {
      window.clearTimeout(timeout);
    }
  }, []);

  const retry = useCallback(() => {
    if (!state.lastRequest) return Promise.reject(new Error("No previous request to retry."));
    return runAction(state.lastRequest);
  }, [runAction, state.lastRequest]);

  return {
    loadingAction: state.loadingAction,
    result: state.result,
    error: state.error,
    lastRequest: state.lastRequest,
    clearResult,
    runAction,
    retry,
  };
}
