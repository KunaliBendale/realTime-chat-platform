export const withRetry = async (fn, { maxRetries = 2, delayMs = 400 } = {}) => {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;

      const canRetry = error?.retryable || /timed out|ECONNABORTED|502|503|504/i.test(error.message || "");

      if (!canRetry || attempt >= maxRetries) {
        throw error;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, delayMs * (attempt + 1));
      });
    }
  }

  throw lastError;
};

export const withTimeout = async (promise, timeoutMs, timeoutMessage = "Request timed out") => {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
};
