
import React, { useState } from 'react';
import { NodeType } from '../types';

interface HeaderProps {
  onAddNode: (type: NodeType) => void;
  onRun: () => void;
  onClear: () => void;
  onSave: (name: string) => void;
  isLoading: boolean;
}

const NodeButton: React.FC<{ type: NodeType, onClick: (type: NodeType) => void }> = ({ type, onClick }) => {
    const label = type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
    return (
        <button
            onClick={() => onClick(type)}
            className="px-3 py-2 text-sm font-medium text-gray-300 bg-gray-800 rounded-md hover:bg-gray-700 transition-colors"
        >
            Add {label}
        </button>
    );
};


export const Header: React.FC<HeaderProps> = ({ onAddNode, onRun, onClear, onSave, isLoading }) => {
    const [saveName, setSaveName] = useState('');

    return (
        <header className="px-4 py-3 bg-gradient-to-r from-[#071021] to-[#021428] flex items-center gap-2 border-b border-gray-800 z-20">
            <h1 className="text-lg font-bold text-blue-300 mr-4">PolyNodes</h1>
            
            <div className="flex items-center gap-2">
                <NodeButton type="math" onClick={onAddNode} />
                <NodeButton type="combine" onClick={onAddNode} />
                <NodeButton type="image_loader" onClick={onAddNode} />
                <NodeButton type="wave_multiplier" onClick={onAddNode} />
                <NodeButton type="generic" onClick={onAddNode} />
            </div>

            <div className="ml-auto flex items-center gap-2">
                 <button onClick={onRun} disabled={isLoading} className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed transition-colors">
                    {isLoading ? 'Running...' : 'Run'}
                </button>
                <button onClick={onClear} className="px-4 py-2 text-sm font-semibold text-gray-200 bg-gray-700 rounded-md hover:bg-gray-600 transition-colors">
                    Clear
                </button>
                <div className="flex items-center gap-1">
                    <input 
                        type="text" 
                        value={saveName} 
                        onChange={e => setSaveName(e.target.value)} 
                        placeholder="Graph name"
                        className="px-3 py-2 text-sm bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <button onClick={() => onSave(saveName)} className="px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-md hover:bg-green-500 transition-colors">
                        Save
                    </button>
                </div>
            </div>
        </header>
    );
};
