import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getDefaultSmartReplies } from "../lib/defaultSmartReplies";
import { isValidObjectId } from "../lib/isValidObjectId";
import { aiService } from "../services/aiService";

const DEBOUNCE_MS = 800;

const withFallbackSuggestions = (list) => {
  const cleaned = Array.isArray(list) ? list.filter(Boolean) : [];
  return cleaned.length > 0 ? cleaned.slice(0, 3) : getDefaultSmartReplies();
};

export function useSmartReplies({ chatId, messages = [], enabled = true }) {
  const [suggestions, setSuggestions] = useState([]);
  const [status, setStatus] = useState("idle");
  const [meta, setMeta] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  const requestIdRef = useRef(0);
  const inFlightKeyRef = useRef(null);
  const debounceRef = useRef(null);

  const lastIncomingMessage = useMemo(() => {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];

      if (message.isOwn || message.isOptimistic) continue;

      const text = (message.content || "").trim();

      if (text) {
        return message;
      }
    }

    return null;
  }, [messages]);

  const contextKey = useMemo(() => {
    if (!chatId || !lastIncomingMessage?.id) return null;
    return `${chatId}:${lastIncomingMessage.id}`;
  }, [chatId, lastIncomingMessage?.id]);

  const fetchSuggestions = useCallback(
    async (forceRefresh = false) => {
      if (!enabled || !chatId || !contextKey || !isValidObjectId(chatId)) {
        setSuggestions([]);
        setStatus("idle");
        return;
      }

      if (inFlightKeyRef.current === contextKey && !forceRefresh) {
        return;
      }

      const requestId = ++requestIdRef.current;
      inFlightKeyRef.current = contextKey;

      setStatus("loading");

      try {
        const response = await aiService.fetchSmartReplies(chatId, { forceRefresh });

        if (requestIdRef.current !== requestId) return;

        const chips = withFallbackSuggestions(response.suggestions);

        setSuggestions(chips);
        setMeta(response.meta || null);
        setStatus(response.cached ? "cached" : "ready");
        setDismissed(false);
      } catch (fetchError) {
        if (requestIdRef.current !== requestId) return;

        if (import.meta.env.DEV) {
          console.debug("[AI] smart replies fallback", fetchError);
        }

        setSuggestions(getDefaultSmartReplies());
        setMeta({ shouldSuggest: true, source: "default", aiGenerated: false });
        setStatus("ready");
        setDismissed(false);
      } finally {
        if (requestIdRef.current === requestId) {
          inFlightKeyRef.current = null;
        }
      }
    },
    [chatId, contextKey, enabled],
  );

  useEffect(() => {
    setDismissed(false);
  }, [contextKey]);

  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    if (!enabled || !contextKey || !isValidObjectId(chatId)) {
      setSuggestions([]);
      setStatus("idle");
      inFlightKeyRef.current = null;
      return undefined;
    }

    debounceRef.current = window.setTimeout(() => {
      fetchSuggestions(false);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [contextKey, enabled, fetchSuggestions, chatId]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    setStatus("idle");
  }, []);

  const retry = useCallback(() => {
    inFlightKeyRef.current = null;
    fetchSuggestions(true);
  }, [fetchSuggestions]);

  const isLoading = status === "loading";

  const visible =
    enabled && !dismissed && Boolean(contextKey) && (isLoading || status === "ready" || status === "cached");

  return {
    suggestions,
    status,
    meta,
    visible,
    dismiss,
    retry,
    isLoading,
  };
};
