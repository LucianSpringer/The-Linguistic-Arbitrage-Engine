import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { DialogueTransmissionVector, CircuitBreakerThresholds } from "../types";

export class GeminiDeepThinkService {
  private ai: GoogleGenAI;
  private model = 'gemini-3-pro-preview';

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  /**
   * Executes a deep thinking query with max budget.
   * Implements exponential backoff for resilience.
   */
  public async executeDeepThought(
    prompt: string, 
    history: DialogueTransmissionVector[]
  ): Promise<string> {
    
    let attempts = 0;
    
    while (attempts < CircuitBreakerThresholds.MAX_RETRY_ATTEMPTS) {
      try {
        // Construct context from history
        const context = history.map(h => `${h.origin}: ${h.payload}`).join('\n');
        const fullPrompt = `
          CONTEXT_HISTORY:
          ${context}

          CURRENT_INPUT:
          ${prompt}

          MISSION:
          Analyze the negotiation leverage. Provide a strategic counter-move.
        `;

        const response: GenerateContentResponse = await this.ai.models.generateContent({
          model: this.model,
          contents: fullPrompt,
          config: {
            // STRICT REQUIREMENT: Thinking Budget set to Max for 3 Pro
            thinkingConfig: { thinkingBudget: 32768 },
            // STRICT REQUIREMENT: Do not set maxOutputTokens when using thinkingBudget (or set it very high, but instruction said do not set)
          }
        });

        return response.text || "DATA_CORRUPTION_EMPTY_RESPONSE";

      } catch (error: any) {
        const errorLog = {
            timestamp: new Date().toISOString(),
            attempt: attempts + 1,
            errorType: error.name,
            errorMessage: error.message,
            stack: error.stack
        };
        console.error(`[GEMINI_DEEP_THINK_FAILURE] :: `, JSON.stringify(errorLog, null, 2));

        attempts++;
        if (attempts >= CircuitBreakerThresholds.MAX_RETRY_ATTEMPTS) {
          return "CIRCUIT_BREAKER_ACTIVATED: UNABLE_TO_PROCESS_THOUGHT_PATTERN";
        }
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
      }
    }
    return "SYSTEM_FAILURE";
  }

  /**
   * Measures round-trip latency to the API using a lightweight model.
   * Returns latency in milliseconds.
   */
  public async measureLatency(): Promise<number> {
    const start = Date.now();
    try {
      // Use Flash for a quick ping
      await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'ping',
      });
      return Date.now() - start;
    } catch (error) {
      console.warn("[LATENCY_CHECK_FAILED]", error);
      return -1;
    }
  }
}
