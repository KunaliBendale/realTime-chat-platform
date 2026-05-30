import axios from "axios";
import { aiConfig } from "../config/ai.config.js";
import { AiError, AiErrorCodes } from "../errors/AiError.js";
import { BaseProvider } from "./BaseProvider.js";

export class ClaudeProvider extends BaseProvider {
  constructor() {
    super("claude");
    this.model = aiConfig.claude.model;
    this.apiKey = aiConfig.claude.apiKey;
  }

  async generateStructuredCompletion({ systemPrompt, userPrompt }) {
    if (!this.apiKey) {
      throw new AiError("Anthropic API key missing", {
        code: AiErrorCodes.NOT_CONFIGURED,
        statusCode: 503,
      });
    }

    try {
      const response = await axios.post(
        "https://api.anthropic.com/v1/messages",
        {
          model: this.model,
          max_tokens: 256,
          temperature: 0.65,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        },
        {
          headers: {
            "x-api-key": this.apiKey,
            "anthropic-version": "2023-06-01",
            "Content-Type": "application/json",
          },
          timeout: aiConfig.smartReply.requestTimeoutMs,
        },
      );

      const text =
        response.data?.content?.find((block) => block.type === "text")?.text || "";
      const usage = response.data?.usage || {};

      return {
        text,
        usage: this.normalizeUsage({
          promptTokens: usage.input_tokens || 0,
          completionTokens: usage.output_tokens || 0,
          totalTokens: (usage.input_tokens || 0) + (usage.output_tokens || 0),
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
