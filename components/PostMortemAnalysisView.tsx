import React from 'react';
import { StrategicAnalysisReport, NegotiationEntropyMetric } from '../types';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

interface PostMortemAnalysisViewProps {
  report: StrategicAnalysisReport;
  metrics: NegotiationEntropyMetric[];
  onReset: () => void;
}

export const PostMortemAnalysisView: React.FC<PostMortemAnalysisViewProps> = ({ report, metrics, onReset }) => {
  
  // Grade Color Logic
  const getGradeColor = (grade: string) => {
    switch(grade) {
      case 'S': return 'text-terminal-green border-terminal-green shadow-[0_0_20px_#00ff41]';
      case 'A': return 'text-terminal-green border-terminal-green';
      case 'B': return 'text-blue-400 border-blue-400';
      case 'C': return 'text-orange-400 border-orange-400';
      default: return 'text-alert-crimson border-alert-crimson';
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-obsidian text-gray-200 overflow-y-auto p-6 font-mono">
      
      {/* Header */}
      <div className="flex justify-between items-start border-b border-matrix-gray pb-6 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-wider text-white mb-2">MISSION DEBRIEF // <span className="text-terminal-green">POST-MORTEM</span></h1>
          <p className="text-xs text-gray-500 uppercase">Strategic Analysis & Psycholinguistic Evaluation</p>
        </div>
        <div className={`text-6xl font-bold border-4 rounded-sm px-6 py-2 ${getGradeColor(report.overallGrade)}`}>
          {report.overallGrade}
        </div>
      </div>

      {/* Top Row: Confidence Chart & Trajectory Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        
        {/* Chart */}
        <div className="lg:col-span-2 bg-black/50 border border-matrix-gray p-4 rounded relative h-80">
          <h3 className="text-xs font-bold text-terminal-green uppercase tracking-widest mb-4">Confidence Trajectory Visualization</h3>
          <ResponsiveContainer width="100%" height="90%">
            <AreaChart data={metrics}>
              <defs>
                <linearGradient id="colorConf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ff41" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00ff41" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="timestamp" tick={false} />
              <YAxis hide domain={[0, 1]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#000', borderColor: '#00ff41', color: '#fff' }}
                itemStyle={{ color: '#00ff41' }}
                labelFormatter={() => ''}
              />
              <ReferenceLine y={0.5} stroke="#333" strokeDasharray="3 3" />
              <Area 
                type="step" 
                dataKey="confidenceScore" 
                stroke="#00ff41" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorConf)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Narrative Analysis */}
        <div className="bg-black/50 border border-matrix-gray p-4 rounded flex flex-col">
          <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">AI Coach Assessment</h3>
          <div className="flex-1 text-sm leading-relaxed text-gray-300 overflow-y-auto pr-2 scrollbar-hide">
            {report.confidenceTrajectoryAnalysis}
          </div>
        </div>

      </div>

      {/* Detailed Grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        
        {/* Strengths */}
        <div className="border border-terminal-green/30 bg-terminal-green/5 p-4 rounded">
          <h3 className="text-xs font-bold text-terminal-green uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="material-icons text-sm">check_circle</span> Tactical Advantages
          </h3>
          <ul className="space-y-3">
            {report.strengths.map((s, i) => (
              <li key={i} className="text-sm">
                <span className="font-bold text-gray-200 block mb-1">✓ {s.point}</span>
                <span className="text-gray-400 text-xs italic">"{s.example}"</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Weaknesses / Missed Opps */}
        <div className="border border-alert-crimson/30 bg-alert-crimson/5 p-4 rounded">
          <h3 className="text-xs font-bold text-alert-crimson uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="material-icons text-sm">warning</span> Missed Opportunities
          </h3>
          <ul className="space-y-3">
            {report.missedOpportunities.map((m, i) => (
              <li key={i} className="text-sm">
                <span className="font-bold text-gray-300 block mb-1">{m.context}</span>
                <div className="bg-black/50 p-2 border-l-2 border-alert-crimson mt-1">
                  <span className="text-xs text-gray-500 block mb-1">BETTER ALTERNATIVE:</span>
                  <span className="text-terminal-green text-xs font-mono">"{m.betterAlternative}"</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Tactics Detected */}
        <div className="border border-matrix-gray bg-gray-900/50 p-4 rounded">
          <h3 className="text-xs font-bold text-orange-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="material-icons text-sm">psychology</span> Opponent Tactics Detected
          </h3>
          <ul className="space-y-2">
            {report.psychologicalTacticsDetected.map((t, i) => (
              <li key={i} className="flex flex-col">
                <span className="text-orange-300 font-bold text-sm">{t.tacticName}</span>
                <span className="text-gray-500 text-xs">{t.description}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Training Recs */}
        <div className="border border-matrix-gray bg-gray-900/50 p-4 rounded">
          <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="material-icons text-sm">fitness_center</span> Recommended Drills
          </h3>
          <ul className="space-y-2">
            {report.trainingRecommendations.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                <span className="text-blue-500 mt-1">➤</span>
                {r}
              </li>
            ))}
          </ul>
        </div>

      </div>

      {/* Footer Controls */}
      <div className="mt-8 flex justify-end">
        <button 
          onClick={onReset}
          className="px-8 py-3 bg-terminal-green text-black font-bold uppercase tracking-widest hover:bg-white transition-colors"
        >
          Initialize New Simulation
        </button>
      </div>

    </div>
  );
};