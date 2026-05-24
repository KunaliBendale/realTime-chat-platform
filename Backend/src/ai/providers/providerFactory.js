import { aiConfig } from "../config/ai.config.js";
import { AiError, AiErrorCodes } from "../errors/AiError.js";
import { ClaudeProvider } from "./ClaudeProvider.js";
import { GeminiProvider } from "./GeminiProvider.js";
import { OpenAIProvider } from "./OpenAIProvider.js";

const providerCache = new Map();

export const getAiProvider = (providerName = aiConfig.provider) => {
  const name = providerName.toLowerCase();

  if (providerCache.has(name)) {
    return providerCache.get(name);
  }

  let provider;

  switch (name) {
    case "gemini":
      provider = new GeminiProvider();
      break;
    case "openai":
      provider = new OpenAIProvider();
      break;
    case "claude":
    case "anthropic":
      provider = new ClaudeProvider();
      break;
    default:
      throw new AiError(`Unsupported AI provider: ${providerName}`, {
        code: AiErrorCodes.NOT_CONFIGURED,
        statusCode: 503,
      });
  }

  providerCache.set(name, provider);
  return provider;
};
