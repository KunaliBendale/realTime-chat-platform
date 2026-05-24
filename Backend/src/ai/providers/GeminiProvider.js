import axios from "axios";
import { aiConfig } from "../config/ai.config.js";
import { AiError, AiErrorCodes } from "../errors/AiError.js";
import { BaseProvider } from "./BaseProvider.js";

/**
 * Gemini Developer API (Google AI Studio)
 * @see https://ai.google.dev/gemini-api/docs/quickstart
 *
 * REST: POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
 * Auth: x-goog-api-key header (recommended; do not pass key only as query param)
 */
export class GeminiProvider extends BaseProvider {
  constructor() {
    super("gemini");
    this.model = aiConfig.gemini.model;
    this.apiKey = aiConfig.gemini.apiKey;
    this.baseUrl = aiConfig.gemini.baseUrl;
  }

  getRequestHeaders() {
    return {
      "Content-Type": "application/json",
      "x-goog-api-key": this.apiKey,
    };
  }

  getGenerateContentUrl() {
    return `${this.baseUrl}/models/${this.model}:generateContent`;
  }

  async generateStructuredCompletion({ systemPrompt, userPrompt }) {
    if (!this.apiKey) {
      throw new AiError("Gemini API key missing", {
        code: AiErrorCodes.NOT_CONFIGURED,
        statusCode: 503,
      });
    }

    const url = this.getGenerateContentUrl();

    const buildBody = ({ useSchema }) => ({
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
        maxOutputTokens: 512,
        responseMimeType: "application/json",
        ...(useSchema
          ? {
              responseSchema: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: { type: "string" },
                    minItems: 1,
                    maxItems: 3,
                  },
                },
                required: ["suggestions"],
              },
            }
          : {}),
      },
    });

    try {
      let response;

      try {
        response = await axios.post(url, buildBody({ useSchema: true }), {
          headers: this.getRequestHeaders(),
          timeout: aiConfig.smartReply.requestTimeoutMs,
        });
      } catch (schemaError) {
        const status = schemaError.response?.status;
        const shouldRetryWithoutSchema = status === 400 || status === 404;

        if (!shouldRetryWithoutSchema) throw schemaError;

        response = await axios.post(url, buildBody({ useSchema: false }), {
          headers: this.getRequestHeaders(),
          timeout: aiConfig.smartReply.requestTimeoutMs,
        });
      }

      const candidate = response.data?.candidates?.[0];
      const finishReason = candidate?.finishReason;

      if (finishReason === "SAFETY" || finishReason === "RECITATION") {
        throw new AiError("Gemini blocked the response", {
          code: AiErrorCodes.PROVIDER,
          statusCode: 502,
          retryable: false,
        });
      }

      const text =
        candidate?.content?.parts
          ?.map((part) => (typeof part.text === "string" ? part.text : ""))
          .join("")
          .trim() || "";

      const usageMetadata = response.data?.usageMetadata || {};

      if (!text) {
        throw new AiError("Gemini returned an empty response", {
          code: AiErrorCodes.PROVIDER,
          statusCode: 502,
          retryable: true,
        });
      }

      let suggestions = [];

      try {
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed?.suggestions)) {
          suggestions = parsed.suggestions.filter((item) => typeof item === "string");
        } else if (Array.isArray(parsed)) {
          suggestions = parsed.filter((item) => typeof item === "string");
        }
      } catch {
        // smartReply.service parseProviderSuggestions handles non-JSON text
      }

      return {
        text,
        suggestions,
        usage: this.normalizeUsage({
          promptTokens: usageMetadata.promptTokenCount || 0,
          completionTokens: usageMetadata.candidatesTokenCount || 0,
          totalTokens: usageMetadata.totalTokenCount || 0,
          model: this.model,
        }),
      };
    } catch (error) {
      if (error instanceof AiError) throw error;

      const status = error.response?.status;
      const providerMessage =
        error.response?.data?.error?.message || error.message || "Gemini request failed";

      throw new AiError(providerMessage, {
        code: AiErrorCodes.PROVIDER,
        statusCode: status === 429 ? 429 : 502,
        retryable: status === 429 || status >= 500 || error.code === "ECONNABORTED",
      });
    }
  }
}
