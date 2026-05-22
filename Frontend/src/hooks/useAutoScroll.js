import { useCallback, useEffect, useRef } from "react";

export function useAutoScroll(deps = []) {
  const containerRef = useRef(null);
  const shouldStickRef = useRef(true);

  const scrollToBottom = useCallback((behavior = "smooth") => {
    const container = containerRef.current;

    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior,
    });
  }, []);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;

    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    shouldStickRef.current = distanceFromBottom < 120;
  }, []);

  useEffect(() => {
    if (shouldStickRef.current) {
      scrollToBottom(deps.length ? "auto" : "smooth");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    containerRef,
    scrollToBottom,
    handleScroll,
    shouldStickRef,
  };
}
