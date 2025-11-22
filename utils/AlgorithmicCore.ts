import { RhetoricalImpactFactor } from "../types";

/**
 * Calculates the Levenshtein Distance between two rhetorical vectors.
 * Uses a 2D matrix approach for optimal pathfinding.
 */
export const computeLevenshteinDeviation = (sourceVector: string, targetVector: string): number => {
  const sourceLen = sourceVector.length;
  const targetLen = targetVector.length;

  if (sourceLen === 0) return targetLen;
  if (targetLen === 0) return sourceLen;

  const matrix: number[][] = [];

  // Initialize matrix
  for (let i = 0; i <= sourceLen; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= targetLen; j++) {
    matrix[0][j] = j;
  }

  // Compute distances
  for (let i = 1; i <= sourceLen; i++) {
    for (let j = 1; j <= targetLen; j++) {
      const cost = sourceVector[i - 1] === targetVector[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // Deletion
        matrix[i][j - 1] + 1, // Insertion
        matrix[i - 1][j - 1] + cost // Substitution
      );
    }
  }

  return matrix[sourceLen][targetLen];
};

/**
 * Analyzes the verbal velocity (WPM) and hesitation density.
 */
export const calculateVerbalVelocityScore = (
  transcript: string,
  durationSeconds: number
): { velocity: number; hesitationCount: number } => {
  if (durationSeconds <= 0) return { velocity: 0, hesitationCount: 0 };

  const words = transcript.trim().split(/\s+/);
  const hesitationMarkers = ['um', 'uh', 'like', 'actually', 'basically', 'sort of', 'mean', 'you know'];
  
  let hesitationCount = 0;
  words.forEach(w => {
    if (hesitationMarkers.includes(w.toLowerCase().replace(/[^a-z]/g, ''))) {
      hesitationCount++;
    }
  });

  const velocity = (words.length / durationSeconds) * 60;
  return { velocity, hesitationCount };
};

/**
 * Calculates the Root Mean Square (RMS) of the acoustic buffer to determine energy.
 * @param buffer The AudioBuffer from the stream
 * @returns value between 0 and 1 representing spectral intensity
 */
export const calculateSpectralEnergy = (buffer: AudioBuffer): number => {
  const rawData = buffer.getChannelData(0);
  let sumSquares = 0;
  for (let i = 0; i < rawData.length; i++) {
    sumSquares += rawData[i] * rawData[i];
  }
  return Math.sqrt(sumSquares / rawData.length);
};

/**
 * Sophisticated heuristic matrix calculation.
 */
export class SentimentMatrixCalculator {
  private static AGGRESSION_LEXICON = {
    'demand': 0.8, 'must': 0.7, 'unacceptable': 0.9, 'final': 0.6, 'refuse': 0.8, 'insist': 0.7,
    'ridiculous': 0.8, 'fail': 0.6, 'hostile': 0.9, 'now': 0.5, 'immediately': 0.6
  };
  
  private static CONCILIATORY_LEXICON = {
    'agree': 0.6, 'understand': 0.5, 'collaborate': 0.7, 'flexible': 0.8, 'help': 0.5,
    'fair': 0.6, 'together': 0.5, 'potential': 0.4, 'perhaps': 0.3, 'consider': 0.4
  };

  private static LOGIC_LEXICON = ['because', 'therefore', 'data', 'statistically', 'result', 'proven', 'consequently', 'analysis', 'metrics', 'roi', 'yield'];

  /**
   * Computes a composite sentiment score (-1 to 1) based on text valence and audio intensity.
   * Also computes confidence based on coherence and delivery.
   */
  public static analyze(
    linguisticArtifact: string, 
    spectralIntensity: number = 0,
    hesitationCount: number = 0
  ): RhetoricalImpactFactor {
    const lowerText = linguisticArtifact.toLowerCase();
    const words = lowerText.split(/\s+/);
    
    let aggressionScore = 0;
    let logicScore = 0;
    let valenceSum = 0; // Positive for conciliatory, Negative for aggression

    // Lexical Analysis
    words.forEach(w => {
      const cleaned = w.replace(/[^a-z]/g, '');
      
      if (this.AGGRESSION_LEXICON[cleaned as keyof typeof this.AGGRESSION_LEXICON]) {
        const val = this.AGGRESSION_LEXICON[cleaned as keyof typeof this.AGGRESSION_LEXICON];
        aggressionScore += (val * 100);
        valenceSum -= val;
      }
      
      if (this.CONCILIATORY_LEXICON[cleaned as keyof typeof this.CONCILIATORY_LEXICON]) {
        const val = this.CONCILIATORY_LEXICON[cleaned as keyof typeof this.CONCILIATORY_LEXICON];
        valenceSum += val;
      }

      if (this.LOGIC_LEXICON.includes(cleaned)) {
        logicScore += 15;
      }
    });

    // Normalize Logic and Aggression
    const normalizedAggression = Math.min(100, aggressionScore);
    const normalizedLogic = Math.min(100, logicScore);
    
    // Clarity penalized by length (verbosity) but boosted by logic
    const clarity = Math.min(100, Math.max(0, 100 - (linguisticArtifact.length * 0.02) + (normalizedLogic * 0.3)));

    // Calculate Emotional Resonance
    let resonance = valenceSum;
    if (words.length < 3) resonance *= 0.5;
    resonance = resonance * (1 + (spectralIntensity * 2));

    if (Math.abs(resonance) < 0.1 && spectralIntensity > 0.2) {
        resonance = -spectralIntensity; 
    }
    const emotionalResonanceIndex = Math.max(-1, Math.min(1, resonance));

    // --- CONFIDENCE CALCULATION ---
    // Base confidence is 1.0 (100%)
    // Penalized by: Hesitation markers, Low Spectral Intensity (mumbling), excessively short responses (unless aggressive)
    let confidence = 1.0;

    // Penalty: Hesitation
    // Each hesitation drops confidence by 0.15
    confidence -= (hesitationCount * 0.15);

    // Penalty: Mumbling (Low Energy)
    // Only apply if there are words spoken
    if (words.length > 0 && spectralIntensity < 0.05) {
      confidence -= 0.2;
    }

    // Bonus: Logic Density or Aggression increases apparent confidence
    confidence += (normalizedLogic * 0.002); // Up to 0.2 boost
    confidence += (normalizedAggression * 0.002); // Up to 0.2 boost

    // Clamp Confidence 0 to 1
    const confidenceScore = Math.max(0, Math.min(1, confidence));

    return {
      clarityScore: clarity,
      aggressionIndex: normalizedAggression,
      logicDensity: normalizedLogic,
      emotionalResonanceIndex,
      confidenceScore
    };
  }
}