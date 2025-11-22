import React, { useState, useRef, useEffect } from 'react';
import { DialogueTransmissionVector, CognitiveLoadState } from '../types';

interface NeuralChatInterfaceProps {
  vectors: DialogueTransmissionVector[];
  onTransmit: (input: string) => void;
  cognitiveState: CognitiveLoadState;
}

export const NeuralChatInterface: React.FC<NeuralChatInterfaceProps> = ({ vectors, onTransmit, cognitiveState }) => {
  const [inputBuffer, setInputBuffer] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [vectors, cognitiveState]);

  const handleSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputBuffer.trim() || cognitiveState === CognitiveLoadState.THINKING) return;
    onTransmit(inputBuffer);
    setInputBuffer('');
  };

  return (
    <div className="flex flex-col h-full bg-obsidian border-l border-matrix-gray relative">
      
      {/* Header */}
      <div className="p-3 border-b border-matrix-gray bg-black/80 backdrop-blur flex justify-between items-center">
        <span className="text-xs font-mono text-terminal-green animate-pulse">
          {cognitiveState === CognitiveLoadState.THINKING ? '>>> NEURAL_PATHWAY_ACTIVE [THINKING]' : '>>> SYSTEM_READY'}
        </span>
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-terminal-green rounded-full"></div>
          <div className="w-2 h-2 bg-matrix-gray rounded-full"></div>
          <div className="w-2 h-2 bg-matrix-gray rounded-full"></div>
        </div>
      </div>

      {/* Vector Stream (Chat) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm" ref={scrollRef}>
        {vectors.map((vector) => (
          <div 
            key={vector.id} 
            className={`flex flex-col ${vector.origin === 'OPERATOR' ? 'items-end' : 'items-start'}`}
          >
            <div className={`max-w-[80%] p-3 border ${
              vector.origin === 'OPERATOR' 
                ? 'border-terminal-green/50 bg-terminal-green/10 text-terminal-green' 
                : 'border-matrix-gray bg-gray-900 text-gray-300'
            }`}>
              <div className="text-[10px] opacity-50 mb-1 border-b border-white/10 pb-1">
                {vector.origin} :: {new Date(vector.timestamp).toLocaleTimeString()}
              </div>
              <div className="whitespace-pre-wrap leading-relaxed">
                {vector.payload}
              </div>
            </div>
          </div>
        ))}

        {cognitiveState === CognitiveLoadState.THINKING && (
          <div className="flex items-start animate-pulse">
            <div className="max-w-[80%] p-3 border border-matrix-gray bg-gray-900 text-terminal-green">
               <span className="inline-block w-2 h-4 bg-terminal-green mr-1 animate-bounce"></span>
               PROCESSING_COMPLEX_THOUGHT_VECTOR...
            </div>
          </div>
        )}
      </div>

      {/* Input Matrix */}
      <form onSubmit={handleSubmission} className="p-4 border-t border-matrix-gray bg-black">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputBuffer}
            onChange={(e) => setInputBuffer(e.target.value)}
            placeholder="Enter rhetorical vector..."
            className="flex-1 bg-gray-900 border border-matrix-gray text-terminal-green p-3 focus:outline-none focus:border-terminal-green font-mono text-sm"
            disabled={cognitiveState === CognitiveLoadState.THINKING}
          />
          <button 
            type="submit"
            disabled={cognitiveState === CognitiveLoadState.THINKING}
            className="bg-terminal-green/10 border border-terminal-green text-terminal-green px-6 hover:bg-terminal-green hover:text-black transition-colors font-bold uppercase text-xs tracking-widest disabled:opacity-50"
          >
            Transmit
          </button>
        </div>
      </form>
    </div>
  );
};