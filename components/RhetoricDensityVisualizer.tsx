import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, BarChart, Bar, ReferenceLine, Cell, 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis 
} from 'recharts';
import { NegotiationEntropyMetric } from '../types';

interface RhetoricDensityVisualizerProps {
  data: NegotiationEntropyMetric[];
  currentSpectralFlux: number; // Real-time amplitude (0.0 - 1.0)
}

export const RhetoricDensityVisualizer: React.FC<RhetoricDensityVisualizerProps> = ({ data, currentSpectralFlux }) => {
  // Calculate latest metrics for display
  const latest = data[data.length - 1] || { 
    timestamp: 0,
    verbalVelocity: 0, 
    levenshteinDelta: 0, 
    sentimentValence: 0,
    confidenceScore: 0,
    logicDensity: 0,
    aggressionIndex: 0,
    clarityScore: 0,
    hesitationMarkers: 0,
    spectralIntensity: 0
  };

  // Dynamic Styles based on metrics
  const velocityColor = latest.verbalVelocity > 160 ? 'border-alert-crimson' : latest.verbalVelocity > 120 ? 'border-terminal-green' : 'border-terminal-green/30';
  const velocityPulse = latest.verbalVelocity > 160 ? 'animate-pulse' : '';
  
  const deviationColor = latest.levenshteinDelta > 20 ? 'border-alert-crimson' : 'border-alert-crimson/30';

  // Construct Radar Data
  const radarData = [
    { subject: 'Logic', A: latest.logicDensity, fullMark: 100 },
    { subject: 'Aggression', A: latest.aggressionIndex, fullMark: 100 },
    { subject: 'Clarity', A: latest.clarityScore, fullMark: 100 },
    { subject: 'Fluidity', A: Math.max(0, 100 - (latest.hesitationMarkers * 10)), fullMark: 100 },
    { subject: 'Energy', A: Math.min(100, latest.spectralIntensity * 1000), fullMark: 100 }, // Scale energy to 100
  ];

  return (
    <div className="grid grid-cols-1 gap-4 w-full h-full p-4 bg-obsidian border border-matrix-gray overflow-y-auto scrollbar-hide">
      
      {/* REAL-TIME AUDIO FLUX VISUALIZER */}
      <div className="flex items-center gap-4 p-3 bg-black border border-matrix-gray rounded-sm shadow-[0_0_10px_rgba(0,255,65,0.1)]">
        <div className="flex flex-col justify-center">
             <span className="text-[10px] font-mono text-gray-500 tracking-widest mb-1">ACOUSTIC FLUX</span>
             <div className="h-8 w-64 bg-gray-900 relative overflow-hidden border border-gray-800">
                 <div 
                    className="absolute top-0 left-0 h-full bg-terminal-green transition-all duration-75 ease-linear opacity-80"
                    style={{ width: `${Math.min(100, currentSpectralFlux * 400)}%` }}
                 ></div>
                 {/* Grid overlay for oscilloscope effect */}
                 <div className="absolute top-0 left-0 w-full h-full grid grid-cols-12 gap-px opacity-20">
                     {Array.from({length: 12}).map((_, i) => (
                         <div key={i} className="bg-black h-full w-px"></div>
                     ))}
                 </div>
             </div>
        </div>
        <div className="font-mono text-xs text-terminal-green">
            {(currentSpectralFlux * 100).toFixed(1)} dBFS
        </div>
      </div>

      {/* CONFIDENCE RADAR MATRIX */}
      <div className={`flex flex-col h-64 bg-black/50 border rounded p-2 transition-all duration-500 border-matrix-gray relative`}>
        <h3 className="text-xs uppercase tracking-widest opacity-70 absolute top-3 left-3">Psycholinguistic Matrix</h3>
        <span className="absolute top-3 right-3 text-2xl font-mono font-bold text-terminal-green">{(latest.confidenceScore * 100).toFixed(0)}%</span>
        
        <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
            <PolarGrid stroke="#333" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 10, fontFamily: 'monospace' }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
                name="Metrics"
                dataKey="A"
                stroke="#00ff41"
                strokeWidth={2}
                fill="#00ff41"
                fillOpacity={0.3}
                isAnimationActive={false}
            />
            <Tooltip 
                contentStyle={{ backgroundColor: '#000', borderColor: '#00ff41', color: '#00ff41' }}
                itemStyle={{ color: '#fff' }}
            />
            </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Verbal Velocity */}
      <div className={`flex flex-col h-40 bg-black/50 border rounded p-2 relative transition-colors duration-300 ${velocityColor} ${velocityPulse}`}>
        <h3 className="text-xs uppercase tracking-widest text-terminal-green mb-2 flex justify-between">
          <span>Verbal Velocity (WPM)</span>
          <span className="text-white">{Math.round(latest.verbalVelocity)}</span>
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00ff41" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#00ff41" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
            <XAxis dataKey="timestamp" tick={false} />
            <YAxis stroke="#333" tick={{fill: '#666', fontSize: 10}} hide />
            <Tooltip 
              contentStyle={{ backgroundColor: '#000', borderColor: '#00ff41', color: '#fff' }}
              itemStyle={{ color: '#00ff41' }}
            />
            <Area type="monotone" dataKey="verbalVelocity" stroke="#00ff41" fillOpacity={1} fill="url(#colorVelocity)" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Levenshtein Deviation */}
      <div className={`flex flex-col h-40 bg-black/50 border rounded p-2 transition-colors duration-300 ${deviationColor}`}>
        <h3 className="text-xs uppercase tracking-widest text-alert-crimson mb-2 flex justify-between">
          <span>Rhetoric Deviation</span>
          <span className="text-white">{latest.levenshteinDelta}</span>
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
            <XAxis dataKey="timestamp" tick={false} />
            <YAxis stroke="#333" tick={{fill: '#666', fontSize: 10}} hide />
            <Tooltip 
              contentStyle={{ backgroundColor: '#000', borderColor: '#ff0033', color: '#fff' }}
              itemStyle={{ color: '#ff0033' }}
            />
            <Line type="stepAfter" dataKey="levenshteinDelta" stroke="#ff0033" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Sentiment Resonance (Bi-directional) */}
      <div className="flex flex-col h-40 bg-black/50 border border-blue-500/30 rounded p-2">
        <h3 className="text-xs uppercase tracking-widest text-blue-400 mb-2 flex justify-between">
          <span>Emotional Resonance</span>
          <span className="text-white">{latest.sentimentValence.toFixed(2)}</span>
        </h3>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
            <XAxis dataKey="timestamp" tick={false} />
            <YAxis stroke="#333" domain={[-1, 1]} hide />
            <Tooltip 
              contentStyle={{ backgroundColor: '#000', borderColor: '#3b82f6', color: '#fff' }}
              cursor={{fill: 'transparent'}}
            />
            <ReferenceLine y={0} stroke="#666" />
            <Bar dataKey="sentimentValence" isAnimationActive={false}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.sentimentValence > 0 ? '#3b82f6' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
};