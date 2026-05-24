export class AiError extends Error {
  constructor(message, { code = "AI_ERROR", statusCode = 500, retryable = false } = {}) {
    super(message);
    this.name = "AiError";
    this.code = code;
    this.statusCode = statusCode;
    this.retryable = retryable;
  }
}

export const AiErrorCodes = {
  DISABLED: "AI_DISABLED",
  NOT_CONFIGURED: "AI_NOT_CONFIGURED",
  RATE_LIMITED: "AI_RATE_LIMITED",
  VALIDATION: "AI_VALIDATION",
  TIMEOUT: "AI_TIMEOUT",
  PROVIDER: "AI_PROVIDER_ERROR",
  PARSE: "AI_PARSE_ERROR",
  EMPTY_CONTEXT: "AI_EMPTY_CONTEXT",
};

export const toAiErrorResponse = (error) => {
  if (error instanceof AiError) {
    return {
      success: false,
      code: error.code,
      message: error.message,
      retryable: error.retryable,
    };
  }

  return {
    success: false,
    code: AiErrorCodes.PROVIDER,
    message: "AI service unavailable",
    retryable: true,
  };
};
