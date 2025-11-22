import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { DialogueTransmissionVector, CircuitBreakerThresholds, NegotiationEntropyMetric, StrategicAnalysisReport } from "../types";

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
   * Generates a Post-Mortem Strategic Analysis Report using Thinking Mode.
   */
  public async generateStrategicAnalysis(
    history: DialogueTransmissionVector[],
    metrics: NegotiationEntropyMetric[]
  ): Promise<StrategicAnalysisReport> {
    
    // 1. Pre-process Metrics for Context
    const avgConfidence = metrics.reduce((acc, m) => acc + m.confidenceScore, 0) / (metrics.length || 1);
    const maxVelocity = Math.max(...metrics.map(m => m.verbalVelocity));
    const avgHesitation = metrics.reduce((acc, m) => acc + m.hesitationMarkers, 0) / (metrics.length || 1);
    
    // 2. Construct Prompt
    const context = history.map(h => `[${new Date(h.timestamp).toLocaleTimeString()}] ${h.origin}: ${h.payload}`).join('\n');
    
    const prompt = `
      ROLE: Expert Negotiation Psychologist & Linguistics Coach.
      TASK: Analyze the following negotiation transcript and telemetry data. Generate a JSON report.
      
      TELEMETRY SUMMARY:
      - Average Confidence Score: ${(avgConfidence * 100).toFixed(1)}%
      - Peak Verbal Velocity: ${maxVelocity.toFixed(0)} WPM
      - Average Hesitation Markers: ${avgHesitation.toFixed(1)} per segment

      TRANSCRIPT:
      ${context}

      REQUIREMENTS:
      You must output a VALID JSON object matching this structure exactly. Do not include markdown formatting or code blocks. Just the raw JSON string.
      
      Structure:
      {
        "strengths": [{"point": "string", "example": "quote from transcript"}],
        "missedOpportunities": [{"context": "what happened", "betterAlternative": "what they should have said"}],
        "psychologicalTacticsDetected": [{"tacticName": "string", "description": "string"}],
        "confidenceTrajectoryAnalysis": "A narrative paragraph explaining how the user's confidence evolved.",
        "trainingRecommendations": ["string", "string"],
        "overallGrade": "S" | "A" | "B" | "C" | "F"
      }
    `;

    try {
      const response: GenerateContentResponse = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          thinkingConfig: { thinkingBudget: 32768 },
        }
      });

      let cleanJson = response.text || "{}";
      // Sanitize Markdown if Gemini adds it despite instructions
      cleanJson = cleanJson.replace(/```json/g, '').replace(/```/g, '').trim();
      
      return JSON.parse(cleanJson) as StrategicAnalysisReport;

    } catch (error) {
      console.error("[ANALYSIS_GENERATION_FAILED]", error);
      throw new Error("Failed to generate strategic report.");
    }
  }

  public async measureLatency(): Promise<number> {
    const start = Date.now();
    try {
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