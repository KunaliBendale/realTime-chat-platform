/**
 * Provider-agnostic contract for LLM backends.
 * Implementations: Gemini, OpenAI, Claude, local models.
 */
export class BaseProvider {
  constructor(name) {
    this.name = name;
  }

  // eslint-disable-next-line no-unused-vars
  async generateStructuredCompletion({ systemPrompt, userPrompt, schemaHint }) {
    throw new Error(`${this.name} provider: generateStructuredCompletion not implemented`);
  }

  normalizeUsage(rawUsage = {}) {
    return {
      promptTokens: rawUsage.promptTokens || 0,
      completionTokens: rawUsage.completionTokens || 0,
      totalTokens: rawUsage.totalTokens || 0,
      provider: this.name,
      model: rawUsage.model || "unknown",
    };
  }
}
