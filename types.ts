import { Type } from "@google/genai";

export enum CognitiveLoadState {
  IDLE = 'NEURAL_IDLE',
  THINKING = 'SYNAPTIC_PROCESSING',
  STREAMING = 'DATA_INGESTION',
  ERROR = 'CIRCUIT_FAILURE',
}

export enum ApplicationViewMode {
  SIMULATION = 'ACTIVE_SIMULATION',
  ANALYSIS = 'POST_MORTEM_DEBRIEF',
}

export interface RhetoricalImpactFactor {
  clarityScore: number;
  aggressionIndex: number;
  logicDensity: number;
  emotionalResonanceIndex: number; // -1.0 to 1.0
  confidenceScore: number; // 0.0 to 1.0
}

export interface NegotiationEntropyMetric {
  timestamp: number;
  verbalVelocity: number; // Words per minute
  hesitationMarkers: number; // Count of filler words
  levenshteinDelta: number; // Deviation from perfect rhetoric
  spectralIntensity: number; // Audio energy
  sentimentValence: number; // Calculated sentiment
  confidenceScore: number; // Calculated confidence
  // Granular Breakdown for Radar Visualization
  logicDensity: number;
  aggressionIndex: number;
  clarityScore: number;
}

export interface DialogueTransmissionVector {
  id: string;
  origin: 'OPERATOR' | 'SYNTHETIC_AGENT';
  payload: string;
  timestamp: number;
  metadata?: {
    thinkingDurationMs?: number;
    modelUsed?: string;
    tokenConsumption?: number;
  };
}

export interface ProbabilityManifold {
  triggerCondition: string; // Keyword regex pattern
  syntheticResponse: string;
  outcomeYield: number; // Projected gain
}

export interface SimulationScenarioMatrix {
  id: string;
  designation: string;
  targetRhetoricPattern: string;
  difficultyLevel: 'LOW_YIELD' | 'HIGH_YIELD' | 'HOSTILE_TAKEOVER';
  probabilityManifolds: ProbabilityManifold[];
}

export interface StrategicAnalysisReport {
  strengths: { point: string; example: string }[];
  missedOpportunities: { context: string; betterAlternative: string }[];
  psychologicalTacticsDetected: { tacticName: string; description: string }[];
  confidenceTrajectoryAnalysis: string;
  trainingRecommendations: string[];
  overallGrade: 'S' | 'A' | 'B' | 'C' | 'F';
}

export const CircuitBreakerThresholds = {
  MAX_LATENCY_MS: 5000,
  MAX_RETRY_ATTEMPTS: 3,
};