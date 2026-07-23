import axios from "axios";
import { aiConfig } from "../config/ai.config.js";
import { AiError, AiErrorCodes } from "../errors/AiError.js";
import { withRetry, withTimeout } from "../utils/retry.js";

const GEMINI_PROVIDER = "gemini";

const normalizeUsage = (usageMetadata = {}) => ({
  promptTokens: usageMetadata.promptTokenCount || 0,
  completionTokens: usageMetadata.candidatesTokenCount || 0,
  totalTokens: usageMetadata.totalTokenCount || 0,
  provider: GEMINI_PROVIDER,
  model: usageMetadata.model || aiConfig.gemini.model,
});

const parseJson = (text = "") => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

class GeminiService {
  constructor() {
    this.provider = GEMINI_PROVIDER;
  }

  get model() {
    return aiConfig.gemini.model;
  }

  getModelsToTry() {
    return [
      aiConfig.gemini.model,
      ...(aiConfig.gemini.fallbackModels || []),
    ].filter((model, index, models) => model && models.indexOf(model) === index);
  }

  getUrl(model = this.model) {
    return `${aiConfig.gemini.baseUrl}/models/${model}:generateContent`;
  }

  get headers() {
    return {
      "Content-Type": "application/json",
      "x-goog-api-key": aiConfig.gemini.apiKey,
    };
  }

  async generateJson({
    systemPrompt,
    userPrompt,
    responseSchema,
    maxOutputTokens = 1024,
    timeoutMs = aiConfig.smartReply.requestTimeoutMs,
  }) {
    if (!aiConfig.gemini.apiKey) {
      throw new AiError("GEMINI_API_KEY is not configured", {
        code: AiErrorCodes.NOT_CONFIGURED,
        statusCode: 503,
        retryable: true,
      });
    }

    let lastError;

    for (const model of this.getModelsToTry()) {
      try {
        return await withRetry(
          () =>
            withTimeout(
              this.requestJson({
                systemPrompt,
                userPrompt,
                responseSchema,
                maxOutputTokens,
                model,
                timeoutMs,
              }),
              timeoutMs,
              "AI request timed out",
            ),
          { maxRetries: aiConfig.smartReply.maxRetries },
        );
      } catch (error) {
        lastError = error;

        const canTryNextModel =
          error instanceof AiError &&
          (error.code === AiErrorCodes.GEMINI || error.code === AiErrorCodes.TIMEOUT) &&
          (error.statusCode === 429 || error.statusCode === 404 || error.statusCode >= 500);

        if (!canTryNextModel) {
          throw error;
        }
      }
    }

    throw lastError;
  }

  async requestJson({
    systemPrompt,
    userPrompt,
    responseSchema,
    maxOutputTokens,
    model,
    timeoutMs = aiConfig.smartReply.requestTimeoutMs,
  }) {
    const buildBody = (useSchema) => ({
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.65,
        topP: 0.9,
        maxOutputTokens,
        responseMimeType: "application/json",
        ...(useSchema && responseSchema ? { responseSchema } : {}),
      },
    });

    try {
      let response;

      try {
        response = await axios.post(this.getUrl(model), buildBody(true), {
          headers: this.headers,
          timeout: timeoutMs,
        });
      } catch (schemaError) {
        const status = schemaError.response?.status;
        const shouldRetryWithoutSchema = responseSchema && (status === 400 || status === 404);

        if (!shouldRetryWithoutSchema) throw schemaError;

        response = await axios.post(this.getUrl(model), buildBody(false), {
          headers: this.headers,
          timeout: timeoutMs,
        });
      }

      const candidate = response.data?.candidates?.[0];
      const finishReason = candidate?.finishReason;

      if (finishReason === "SAFETY" || finishReason === "RECITATION") {
        throw new AiError("Gemini blocked the response", {
          code: AiErrorCodes.GEMINI,
          statusCode: 502,
          retryable: false,
        });
      }

      const text =
        candidate?.content?.parts
          ?.map((part) => (typeof part.text === "string" ? part.text : ""))
          .join("")
          .trim() || "";

      if (!text) {
        throw new AiError("Gemini returned an empty response", {
          code: AiErrorCodes.GEMINI,
          statusCode: 502,
          retryable: true,
        });
      }

      return {
        text,
        json: parseJson(text),
        usage: normalizeUsage({
          ...response.data?.usageMetadata,
          model,
        }),
      };
    } catch (error) {
      if (error instanceof AiError) throw error;

      const status = error.response?.status;
      const providerMessage =
        error.response?.data?.error?.message || error.message || "Gemini request failed";
      const isTimeout =
        error.code === "ECONNABORTED" || /timed out|timeout/i.test(providerMessage);

      throw new AiError(providerMessage, {
        code: isTimeout ? AiErrorCodes.TIMEOUT : AiErrorCodes.GEMINI,
        statusCode: status || 502,
        retryable: status === 429 || status >= 500 || isTimeout,
      });
    }
  }
}

export const geminiService = new GeminiService();
