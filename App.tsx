
'use client';

import React, { useEffect, useRef } from 'react';
import {
  DialogueTransmissionVector,
  CognitiveLoadState,
  ApplicationViewMode
} from './types';
import {
  computeLevenshteinDeviation,
  calculateVerbalVelocityScore,
  SentimentMatrixCalculator
} from './utils/AlgorithmicCore';
import { useVoiceStreamProcessor } from './hooks/useVoiceStreamProcessor';
import { GeminiDeepThinkService } from './services/GeminiDeepThinkService';
import { ScenarioInjectionModule } from './services/ScenarioInjectionModule';
import { RhetoricDensityVisualizer } from './components/RhetoricDensityVisualizer';
import { NeuralChatInterface } from './components/NeuralChatInterface';
import { PostMortemAnalysisView } from './components/PostMortemAnalysisView';
import { useAppStore } from './store/useAppStore';

const App: React.FC = () => {

  // Services
  const scenarioModule = ScenarioInjectionModule.getInstance();
  const deepThinkServiceRef = useRef<GeminiDeepThinkService | null>(null);

  // Zustand Store
  const {
    activeScenario,
    setActiveScenario,
    entropyMetrics,
    addEntropyMetric,
    transmissionVectors,
    addTransmissionVector,
    clearTransmissionVectors,
    clearEntropyMetrics,
    cognitiveState,
    setCognitiveState,
    isAcousticCaptureActive,
    toggleAcousticCapture,
    currentSpectralFlux,
    setCurrentSpectralFlux,
    selectedVoice,
    setSelectedVoice,
    networkLatency,
    setNetworkLatency,
    viewMode,
    setViewMode,
    analysisReport,
    setAnalysisReport,
    resetSimulation
  } = useAppStore();

  // Audio Analysis Refs
  const latestAudioEnergyRef = useRef<number>(0);

  // Available Voices
  const availableVoices = ['Kore', 'Fenrir', 'Puck', 'Charon', 'Zephyr'];

  // Initialize Deep Think Service & Measure Latency
  useEffect(() => {
    // Initialize service (no API key needed - uses backend proxy)
    deepThinkServiceRef.current = new GeminiDeepThinkService();

    // Initialize active scenario if not set
    if (!activeScenario) {
      setActiveScenario(scenarioModule.retrieveScenarioLibrary()[0]);
    }

    // Measure Latency immediately and then every 30s
    const measure = async () => {
      if (deepThinkServiceRef.current) {
        const lat = await deepThinkServiceRef.current.measureLatency();
        setNetworkLatency(lat);
      }
    };
    measure();
    const interval = setInterval(measure, 30000);
    return () => clearInterval(interval);
  }, []);

  // Handlers for Live API
  const handleTranscriptUpdate = (text: string, _isFinal: boolean) => {
    if (!activeScenario) return;

    // 1. Levenshtein against the specific Scenario Target
    const delta = computeLevenshteinDeviation(text, activeScenario.targetRhetoricPattern);

    // 2. Velocity & Hesitation
    const velocityData = calculateVerbalVelocityScore(text, 5); // Approx 5s window

    // 3. Sentiment Analysis (using latest audio energy as intensity modifier)
    const rhetoricFactor = SentimentMatrixCalculator.analyze(
      text,
      latestAudioEnergyRef.current,
      velocityData.hesitationCount
    );

    addEntropyMetric({
      timestamp: Date.now(),
      verbalVelocity: velocityData.velocity,
      hesitationMarkers: velocityData.hesitationCount,
      levenshteinDelta: delta,
      spectralIntensity: latestAudioEnergyRef.current,
      sentimentValence: rhetoricFactor.emotionalResonanceIndex,
      confidenceScore: rhetoricFactor.confidenceScore,
      // Expanded Metrics for Radar
      logicDensity: rhetoricFactor.logicDensity,
      aggressionIndex: rhetoricFactor.aggressionIndex,
      clarityScore: rhetoricFactor.clarityScore
    });
  };

  const handleAudioData = (_buffer: AudioBuffer) => {
    // This is model output audio
    // We can track it if needed, but input flux is handled by callback
  };

  // Callback for realtime input visualization
  const handleSpectralFlux = (flux: number) => {
    setCurrentSpectralFlux(flux);
    latestAudioEnergyRef.current = flux;
  };

  // Hook Integration (no API key needed - uses backend proxy)
  const {
    isConnectionActive,
    connectionError,
    initiateNeuralLink,
    severNeuralLink
  } = useVoiceStreamProcessor({
    voiceName: selectedVoice,
    isAcousticCaptureActive,
    onTranscriptUpdate: handleTranscriptUpdate,
    onAudioData: handleAudioData,
    onSpectralFluxAnalysis: handleSpectralFlux
  });

  // Automatic Fallback Logic
  useEffect(() => {
    if (connectionError && connectionError.includes("CIRCUIT_BREAKER_OPEN")) {
      console.warn("[SYSTEM_ADVISORY] Connection lost. Auto-engaging Simulation Matrix.");
    }
  }, [connectionError]);


  // Chat Handler
  const handleManualTransmit = async (input: string) => {
    const newVector: DialogueTransmissionVector = {
      id: crypto.randomUUID(),
      origin: 'OPERATOR',
      payload: input,
      timestamp: Date.now()
    };

    addTransmissionVector(newVector);
    setCognitiveState(CognitiveLoadState.THINKING);

    // Perform Analysis for Metrics even on text input
    handleTranscriptUpdate(input, true);

    // Branch: Live API vs Simulation Mode
    if (isConnectionActive && deepThinkServiceRef.current && !connectionError) {
      const response = await deepThinkServiceRef.current.executeDeepThought(input, transmissionVectors);
      addSyntheticResponse(response);
    } else {
      // Offline/Fallback: Use Scenario Injection
      if (activeScenario) {
        console.log(`[FALLBACK_TRIGGERED] Processing via Simulation Matrix: ${activeScenario.id} `);
        setTimeout(() => {
          if (activeScenario) {
            const simResponse = scenarioModule.processOfflineSimulation(activeScenario.id, input);
            addSyntheticResponse(simResponse);
          }
        }, 1500);
      }
    }
  };

  const addSyntheticResponse = (payload: string) => {
    const responseVector: DialogueTransmissionVector = {
      id: crypto.randomUUID(),
      origin: 'SYNTHETIC_AGENT',
      payload: payload,
      timestamp: Date.now()
    };
    addTransmissionVector(responseVector);
    setCognitiveState(CognitiveLoadState.IDLE);
  };

  const handleScenarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    const s = scenarioModule.getScenarioById(newId);

    if (s) {
      console.log(`[SCENARIO_SHIFT] Timestamp: ${new Date().toISOString()} | Previous: ${activeScenario?.id || 'NONE'} | New: ${newId}`);
      setActiveScenario(s);
      clearTransmissionVectors();
      clearEntropyMetrics();
    }
  };

  // COACH MODE / ANALYSIS TRIGGER
  const handleTerminateAndAnalyze = async () => {
    if (!deepThinkServiceRef.current) return;

    // Sever live connection first
    if (isConnectionActive) severNeuralLink();

    setCognitiveState(CognitiveLoadState.THINKING);

    try {
      const report = await deepThinkServiceRef.current.generateStrategicAnalysis(transmissionVectors, entropyMetrics);
      setAnalysisReport(report);
      setViewMode(ApplicationViewMode.ANALYSIS);
    } catch (e) {
      console.error(e);
      // Fallback if analysis fails
      alert("ANALYSIS_FAILURE: Unable to generate Post-Mortem.");
    } finally {
      setCognitiveState(CognitiveLoadState.IDLE);
    }
  };



  // Difficulty Color Helper
  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'HOSTILE_TAKEOVER': return 'text-alert-crimson border-alert-crimson';
      case 'HIGH_YIELD': return 'text-orange-500 border-orange-500';
      default: return 'text-terminal-green border-terminal-green';
    }
  };

  // RENDER: ANALYSIS MODE
  if (viewMode === ApplicationViewMode.ANALYSIS && analysisReport) {
    return (
      <div className="w-screen h-screen bg-obsidian flex flex-col">
        <PostMortemAnalysisView
          report={analysisReport}
          metrics={entropyMetrics}
          onReset={resetSimulation}
        />
      </div>
    );
  }

  // RENDER: SIMULATION MODE
  return (
    <div className="w-screen h-screen bg-obsidian text-gray-200 flex flex-col overflow-hidden">

      {/* Top Bar */}
      <header className="h-14 border-b border-matrix-gray flex items-center justify-between px-6 bg-black">
        <div className="flex items-center gap-3">
          <span className="material-icons text-terminal-green">graphic_eq</span>
          <h1 className="font-mono font-bold tracking-wider text-lg">LINGUISTIC <span className="text-terminal-green">ARBITRAGE</span> ENGINE</h1>
          {/* Latency Display */}
          <span className={`text - [10px] font - mono ml - 4 px - 2 py - 0.5 border ${networkLatency > 500 ? 'text-alert-crimson border-alert-crimson' : 'text-gray-500 border-gray-800'} `}>
            LATENCY: {networkLatency > -1 ? `${networkLatency} ms` : '---'}
          </span>
        </div>
        <div className="flex items-center gap-4">

          {/* Voice Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-gray-500 uppercase">AGENT VOICE</span>
            <select
              className="bg-matrix-gray text-xs font-mono border border-gray-700 p-1 focus:border-terminal-green focus:outline-none text-terminal-green"
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              disabled={isConnectionActive}
            >
              {availableVoices.map(voice => (
                <option key={voice} value={voice}>{voice.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* Scenario Selector */}
          <select
            className={`bg-matrix-gray text-xs font-mono border p-1 focus:outline-none ${activeScenario ? getDifficultyColor(activeScenario.difficultyLevel).split(' ')[1] : 'border-gray-700'}`}
            value={activeScenario?.id || ''}
            onChange={handleScenarioChange}
          >
            {scenarioModule.retrieveScenarioLibrary().map(s => (
              <option key={s.id} value={s.id}>
                {s.designation} [{s.difficultyLevel}]
              </option>
            ))}
          </select>

          {/* Controls */}
          <div className="flex gap-2">
            {/* Mic Toggle */}
            <button
              onClick={toggleAcousticCapture}
              className={`px - 3 py - 1 text - xs font - mono border font - bold transition - all flex items - center gap - 2 ${isAcousticCaptureActive ? 'bg-gray-800 text-gray-200 border-gray-600' : 'bg-alert-crimson/20 text-alert-crimson border-alert-crimson'} `}
              title={isAcousticCaptureActive ? "Disable Mic (Manual Mode)" : "Enable Mic (Voice Mode)"}
            >
              <span className="material-icons text-[14px]">{isAcousticCaptureActive ? 'mic' : 'mic_off'}</span>
              {isAcousticCaptureActive ? 'VOICE ON' : 'MANUAL ONLY'}
            </button>

            <button
              onClick={isConnectionActive ? severNeuralLink : initiateNeuralLink}
              className={`px - 3 py - 1 text - xs font - mono border font - bold transition - all ${isConnectionActive ? 'bg-terminal-green text-black border-terminal-green' : 'bg-transparent text-gray-500 border-gray-700 hover:border-terminal-green hover:text-terminal-green'} `}
            >
              {isConnectionActive ? 'LIVE NEURAL LINK' : 'CONNECT LIVE'}
            </button>

            {/* TERMINATE & ANALYZE BUTTON */}
            <button
              onClick={handleTerminateAndAnalyze}
              disabled={transmissionVectors.length < 2 || cognitiveState === CognitiveLoadState.THINKING}
              className={`px - 3 py - 1 text - xs font - mono border font - bold transition - all 
                  ${cognitiveState === CognitiveLoadState.THINKING
                  ? 'bg-gray-800 text-gray-500 border-gray-800 animate-pulse'
                  : 'bg-alert-crimson text-white border-alert-crimson hover:bg-red-600'
                } `}
            >
              {cognitiveState === CognitiveLoadState.THINKING ? 'GENERATING REPORT...' : 'TERMINATE & ANALYZE'}
            </button>
          </div>

        </div>
      </header>

      {/* Main Dashboard Grid */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left: Metrics & Controls */}
        <div className="w-1/2 flex flex-col border-r border-matrix-gray p-4 gap-4 overflow-y-auto">

          {/* System Advisory / Fallback Notification */}
          <div className="bg-gray-900/50 border border-matrix-gray p-4 relative overflow-hidden">
            {connectionError && (
              <div className="absolute inset-0 bg-alert-crimson/10 flex items-center justify-center backdrop-blur-sm z-10">
                <div className="bg-black border border-alert-crimson p-4 shadow-2xl animate-pulse">
                  <h3 className="text-alert-crimson font-bold text-sm mb-1">⚠ NEURAL LINK SEVERED</h3>
                  <p className="text-xs text-gray-300">{connectionError}</p>
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs text-gray-500 font-mono uppercase tracking-widest">System Status</h2>
            </div>
            <div className="flex gap-4 items-center">
              <div className={`h - 3 w - 3 rounded - full ${isConnectionActive ? 'bg-terminal-green animate-pulse' : 'bg-gray-600'} `}></div>
              <span className="text-sm font-mono">{isConnectionActive ? 'NEURAL UPLINK ESTABLISHED' : 'OFFLINE: LOCAL SIMULATION ACTIVE'}</span>
            </div>
          </div>

          {/* Charts */}
          <div className="flex-1 min-h-[600px]">
            <RhetoricDensityVisualizer
              data={entropyMetrics}
              currentSpectralFlux={currentSpectralFlux}
            />
          </div>

          {/* Target Pattern with Difficulty Indicator */}
          {activeScenario && (
            <div className={`p-4 border border-dashed font-mono text-xs ${getDifficultyColor(activeScenario.difficultyLevel).replace('text-', 'border-')}`}>
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">TARGET RHETORIC PATTERN ({activeScenario.designation}):</span>
                <span className={`font-bold ${getDifficultyColor(activeScenario.difficultyLevel).split(' ')[0]}`}>
                  [{activeScenario.difficultyLevel}]
                </span>
              </div>
              <p className="text-gray-300">"{activeScenario.targetRhetoricPattern}"</p>
            </div>
          )}

        </div>

        {/* Right: Chat Interface */}
        <div className="w-1/2 h-full">
          <NeuralChatInterface
            vectors={transmissionVectors}
            onTransmit={handleManualTransmit}
            cognitiveState={cognitiveState}
          />
        </div>

      </div>
    </div>
  );
};

export default App;