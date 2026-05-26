import { useCallback, useEffect, useRef, useState } from "react";
import { canEnhanceMessage, getEnhanceableMessage } from "../lib/messageEnhancement";
import { aiService } from "../services/aiService";

const FALLBACK_ERROR = "Unable to enhance message right now";

export function useMessageEnhancement() {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [activeTone, setActiveTone] = useState(null);
  const requestIdRef = useRef(0);
  const inFlightRef = useRef(false);
  const successTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        window.clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  const clearError = useCallback(() => {
    setError("");
  }, []);

  const enhanceMessage = useCallback(async ({ message, tone }) => {
    const cleanMessage = getEnhanceableMessage(message);

    if (!canEnhanceMessage(cleanMessage) || inFlightRef.current) {
      return null;
    }

    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    inFlightRef.current = true;
    setStatus("loading");
    setActiveTone(tone);
    setError("");

    try {
      const response = await aiService.enhanceMessage({
        message: cleanMessage,
        tone,
      });

      if (requestIdRef.current !== requestId) return null;

      const enhancedMessage = response?.enhancedMessage?.trim();

      if (!enhancedMessage) {
        throw new Error("Invalid enhancement response");
      }

      setStatus("success");
      if (successTimerRef.current) {
        window.clearTimeout(successTimerRef.current);
      }

      successTimerRef.current = window.setTimeout(() => {
        if (requestIdRef.current === requestId) {
          setStatus("idle");
          setActiveTone(null);
        }
      }, 900);

      return enhancedMessage;
    } catch {
      if (requestIdRef.current === requestId) {
        setStatus("error");
        setError(FALLBACK_ERROR);
      }

      return null;
    } finally {
      if (requestIdRef.current === requestId) {
        inFlightRef.current = false;
      }
    }
  }, []);

  return {
    activeTone,
    clearError,
    enhanceMessage,
    error,
    isEnhancing: status === "loading",
    status,
  };
}
