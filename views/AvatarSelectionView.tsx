import React from 'react';
import { AIType } from '../types';
import { ASSISTANTS } from '../config/aiAssistants';

interface AvatarSelection {
    type: AIType;
    avatarKey: string;
}

interface AvatarSelectionViewProps {
  onSelect: (selection: AvatarSelection) => void;
}

const AvatarSelectionView: React.FC<AvatarSelectionViewProps> = ({ onSelect }) => {
  return (
    <div className="w-full flex flex-col items-center justify-center p-4">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800">相談相手を選んでください</h1>
        <p className="mt-2 text-slate-600">どのアシスタントと話したいですか？</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        
        {ASSISTANTS.map(assistant => (
            <button 
              key={assistant.id}
              onClick={() => onSelect({ type: assistant.type, avatarKey: assistant.id })}
              className="w-full max-w-xs flex flex-col items-center bg-white p-6 rounded-2xl shadow-lg border border-slate-200 transition-all duration-300 hover:shadow-2xl hover:scale-105 focus:outline-none focus:ring-4 focus:ring-sky-300"
            >
              <div className="w-32 h-32 mb-4 rounded-full overflow-hidden bg-slate-200">
                {assistant.avatarComponent}
              </div>
              <h3 className="text-lg font-bold text-slate-800 text-center">{assistant.title}</h3>
              <p className="text-slate-600 mt-2 h-12 w-full text-sm text-center">{assistant.description}</p>
              <div className="mt-4 w-full px-6 py-3 bg-sky-600 text-white font-semibold rounded-lg shadow-md group-hover:bg-sky-700 transition-colors">
                このアシスタントと話す
              </div>
            </button>
        ))}

      </div>
    </div>
  );
};

export default AvatarSelectionView;