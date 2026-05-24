import axios from "axios";
import { aiConfig } from "../config/ai.config.js";
import { AiError, AiErrorCodes } from "../errors/AiError.js";
import { BaseProvider } from "./BaseProvider.js";

export class OpenAIProvider extends BaseProvider {
  constructor() {
    super("openai");
    this.model = aiConfig.openai.model;
    this.apiKey = aiConfig.openai.apiKey;
  }

  async generateStructuredCompletion({ systemPrompt, userPrompt }) {
    if (!this.apiKey) {
      throw new AiError("OpenAI API key missing", {
        code: AiErrorCodes.NOT_CONFIGURED,
        statusCode: 503,
      });
    }

    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: this.model,
          temperature: 0.65,
          max_tokens: 256,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: aiConfig.smartReply.requestTimeoutMs,
        },
      );

      const text = response.data?.choices?.[0]?.message?.content || "";
      const usage = response.data?.usage || {};

      return {
        text,
        usage: this.normalizeUsage({
          promptTokens: usage.prompt_tokens || 0,
          completionTokens: usage.completion_tokens || 0,
          totalTokens: usage.total_tokens || 0,
          model: this.model,
        }),
      };
    } catch (error) {
      const status = error.response?.status;

      throw new AiError(error.response?.data?.error?.message || error.message, {
        code: AiErrorCodes.PROVIDER,
        statusCode: status === 429 ? 429 : 502,
        retryable: status === 429 || status >= 500,
      });
    }
  }
}
