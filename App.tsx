import React, { useState, useEffect, useRef } from 'react';
import { 
  NegotiationEntropyMetric, 
  DialogueTransmissionVector, 
  CognitiveLoadState,
  SimulationScenarioMatrix
} from './types';
import { 
  computeLevenshteinDeviation, 
  calculateVerbalVelocityScore, 
  calculateSpectralEnergy,
  SentimentMatrixCalculator
} from './utils/AlgorithmicCore';
import { useVoiceStreamProcessor } from './hooks/useVoiceStreamProcessor';
import { GeminiDeepThinkService } from './services/GeminiDeepThinkService';
import { ScenarioInjectionModule } from './services/ScenarioInjectionModule';
import { RhetoricDensityVisualizer } from './components/RhetoricDensityVisualizer';
import { NeuralChatInterface } from './components/NeuralChatInterface';

const App: React.FC = () => {
  const apiKey = process.env.API_KEY || '';
  
  // Services
  const scenarioModule = ScenarioInjectionModule.getInstance();
  const deepThinkServiceRef = useRef<GeminiDeepThinkService | null>(null);

  // State
  const [activeScenario, setActiveScenario] = useState<SimulationScenarioMatrix>(scenarioModule.retrieveScenarioLibrary()[0]);
  const [entropyMetrics, setEntropyMetrics] = useState<NegotiationEntropyMetric[]>([]);
  const [transmissionVectors, setTransmissionVectors] = useState<DialogueTransmissionVector[]>([]);
  const [cognitiveState, setCognitiveState] = useState<CognitiveLoadState>(CognitiveLoadState.IDLE);
  
  // Acoustic Controls
  const [isAcousticCaptureActive, setIsAcousticCaptureActive] = useState<boolean>(true);
  const [currentSpectralFlux, setCurrentSpectralFlux] = useState<number>(0);
  const [selectedVoice, setSelectedVoice] = useState<string>('Kore');
  const [networkLatency, setNetworkLatency] = useState<number>(-1);

  // Audio Analysis Refs
  const latestAudioEnergyRef = useRef<number>(0);

  // Available Voices
  const availableVoices = ['Kore', 'Fenrir', 'Puck', 'Charon', 'Zephyr'];

  // Initialize Deep Think Service & Measure Latency
  useEffect(() => {
    if (apiKey) {
      deepThinkServiceRef.current = new GeminiDeepThinkService(apiKey);
      
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
    }
  }, [apiKey]);

  // Handlers for Live API
  const handleTranscriptUpdate = (text: string, isFinal: boolean) => {
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

    setEntropyMetrics(prev => [
      ...prev.slice(-19), 
      {
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
      }
    ]);
  };

  const handleAudioData = (buffer: AudioBuffer) => {
    // This is model output audio
    // We can track it if needed, but input flux is handled by callback
  };
  
  // Callback for realtime input visualization
  const handleSpectralFlux = (flux: number) => {
    setCurrentSpectralFlux(flux);
    latestAudioEnergyRef.current = flux;
  };

  // Hook Integration
  const { 
    isConnectionActive, 
    connectionError, 
    initiateNeuralLink, 
    severNeuralLink 
  } = useVoiceStreamProcessor({
    apiKey,
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

  // Manual Mode Toggle (Disconnects WebSockets, effectively offline mode)
  const toggleSimulationMode = () => {
    if (isConnectionActive) {
      severNeuralLink();
    } else {
       // No-op: Connect is manual
    }
  };

  // Mic Toggle
  const toggleAcousticCapture = () => {
    setIsAcousticCaptureActive(prev => !prev);
  };

  // Chat Handler
  const handleManualTransmit = async (input: string) => {
    const newVector: DialogueTransmissionVector = {
      id: crypto.randomUUID(),
      origin: 'OPERATOR',
      payload: input,
      timestamp: Date.now()
    };

    setTransmissionVectors(prev => [...prev, newVector]);
    setCognitiveState(CognitiveLoadState.THINKING);

    // Perform Analysis for Metrics even on text input
    handleTranscriptUpdate(input, true);

    // Branch: Live API vs Simulation Mode
    if (isConnectionActive && deepThinkServiceRef.current && !connectionError) {
      const response = await deepThinkServiceRef.current.executeDeepThought(input, transmissionVectors);
      addSyntheticResponse(response);
    } else {
      // Offline/Fallback: Use Scenario Injection
      console.log(`[FALLBACK_TRIGGERED] Processing via Simulation Matrix: ${activeScenario.id}`);
      setTimeout(() => {
        const simResponse = scenarioModule.processOfflineSimulation(activeScenario.id, input);
        addSyntheticResponse(simResponse);
      }, 1500);
    }
  };

  const addSyntheticResponse = (payload: string) => {
    const responseVector: DialogueTransmissionVector = {
      id: crypto.randomUUID(),
      origin: 'SYNTHETIC_AGENT',
      payload: payload,
      timestamp: Date.now()
    };
    setTransmissionVectors(prev => [...prev, responseVector]);
    setCognitiveState(CognitiveLoadState.IDLE);
  };

  const handleScenarioChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newId = e.target.value;
    const s = scenarioModule.getScenarioById(newId);
    
    if(s) {
      console.log(`[SCENARIO_SHIFT] Timestamp: ${new Date().toISOString()} | Previous: ${activeScenario.id} | New: ${newId}`);
      setActiveScenario(s);
      setTransmissionVectors([]); 
      setEntropyMetrics([]);
    }
  };

  // Difficulty Color Helper
  const getDifficultyColor = (level: string) => {
    switch(level) {
      case 'HOSTILE_TAKEOVER': return 'text-alert-crimson border-alert-crimson';
      case 'HIGH_YIELD': return 'text-orange-500 border-orange-500';
      default: return 'text-terminal-green border-terminal-green';
    }
  };

  return (
    <div className="w-screen h-screen bg-obsidian text-gray-200 flex flex-col overflow-hidden">
      
      {/* Top Bar */}
      <header className="h-14 border-b border-matrix-gray flex items-center justify-between px-6 bg-black">
        <div className="flex items-center gap-3">
          <span className="material-icons text-terminal-green">graphic_eq</span>
          <h1 className="font-mono font-bold tracking-wider text-lg">LINGUISTIC <span className="text-terminal-green">ARBITRAGE</span> ENGINE</h1>
          {/* Latency Display */}
          <span className={`text-[10px] font-mono ml-4 px-2 py-0.5 border ${networkLatency > 500 ? 'text-alert-crimson border-alert-crimson' : 'text-gray-500 border-gray-800'}`}>
            LATENCY: {networkLatency > -1 ? `${networkLatency}ms` : '---'}
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
            className={`bg-matrix-gray text-xs font-mono border p-1 focus:outline-none ${getDifficultyColor(activeScenario.difficultyLevel).split(' ')[1]}`}
            value={activeScenario.id}
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
                className={`px-3 py-1 text-xs font-mono border font-bold transition-all flex items-center gap-2 ${isAcousticCaptureActive ? 'bg-gray-800 text-gray-200 border-gray-600' : 'bg-alert-crimson/20 text-alert-crimson border-alert-crimson'}`}
                title={isAcousticCaptureActive ? "Disable Mic (Manual Mode)" : "Enable Mic (Voice Mode)"}
             >
               <span className="material-icons text-[14px]">{isAcousticCaptureActive ? 'mic' : 'mic_off'}</span>
               {isAcousticCaptureActive ? 'VOICE ON' : 'MANUAL ONLY'}
             </button>

             <button
                onClick={isConnectionActive ? severNeuralLink : initiateNeuralLink}
                className={`px-3 py-1 text-xs font-mono border font-bold transition-all ${isConnectionActive ? 'bg-terminal-green text-black border-terminal-green' : 'bg-transparent text-gray-500 border-gray-700 hover:border-terminal-green hover:text-terminal-green'}`}
             >
               {isConnectionActive ? 'LIVE NEURAL LINK' : 'CONNECT LIVE'}
             </button>
             
             <button
                onClick={toggleSimulationMode}
                disabled={!isConnectionActive}
                className={`px-3 py-1 text-xs font-mono border font-bold transition-all ${!isConnectionActive ? 'bg-blue-500/20 text-blue-400 border-blue-500' : 'bg-transparent text-gray-500 border-gray-700 hover:border-blue-500 hover:text-blue-500'}`}
             >
               SIMULATION MODE
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
               <div className={`h-3 w-3 rounded-full ${isConnectionActive ? 'bg-terminal-green animate-pulse' : 'bg-gray-600'}`}></div>
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
          <div className={`p-4 border border-dashed font-mono text-xs ${getDifficultyColor(activeScenario.difficultyLevel).replace('text-', 'border-')}`}>
            <div className="flex justify-between mb-2">
                <span className="text-gray-500">TARGET RHETORIC PATTERN ({activeScenario.designation}):</span>
                <span className={`font-bold ${getDifficultyColor(activeScenario.difficultyLevel).split(' ')[0]}`}>
                    [{activeScenario.difficultyLevel}]
                </span>
            </div>
            <p className="text-gray-300">"{activeScenario.targetRhetoricPattern}"</p>
          </div>

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
