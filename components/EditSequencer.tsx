import React, { useState } from 'react';
import { AddIcon, DeleteIcon, MoveUpIcon, MoveDownIcon } from './Icons';

interface EditSequencerProps {
  prompts: string[];
  setPrompts: React.Dispatch<React.SetStateAction<string[]>>;
}

const EditSequencer: React.FC<EditSequencerProps> = ({ prompts, setPrompts }) => {
  const [newPrompt, setNewPrompt] = useState('');

  const handleAddPrompt = () => {
    if (newPrompt.trim()) {
      setPrompts([...prompts, newPrompt.trim()]);
      setNewPrompt('');
    }
  };

  const handleDeletePrompt = (index: number) => {
    setPrompts(prompts.filter((_, i) => i !== index));
  };

  const handleMovePrompt = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newPrompts = [...prompts];
      [newPrompts[index - 1], newPrompts[index]] = [newPrompts[index], newPrompts[index - 1]];
      setPrompts(newPrompts);
    }
    if (direction === 'down' && index < prompts.length - 1) {
      const newPrompts = [...prompts];
      [newPrompts[index + 1], newPrompts[index]] = [newPrompts[index], newPrompts[index + 1]];
      setPrompts(newPrompts);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddPrompt();
    }
  };

  return (
    <div className="space-y-4">
        <h3 className="text-xl font-bold text-slate-800">
            Define Edit Sequence
        </h3>
        <div className="flex gap-2">
            <input
                type="text"
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., 'add a unicorn'"
                className="flex-grow bg-slate-100 border border-slate-300 text-slate-800 rounded-md px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
            />
            <button
                onClick={handleAddPrompt}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2 rounded-md transition-colors flex-shrink-0"
                title="Add Prompt"
            >
                <AddIcon />
            </button>
        </div>
        <div className="space-y-2">
            {prompts.length > 0 ? (
                prompts.map((prompt, index) => (
                    <div
                        key={index}
                        className="flex items-center gap-2 bg-slate-50 p-2 rounded-md group"
                    >
                        <span className="text-indigo-500 font-mono text-sm mr-2">{index + 1}.</span>
                        <p className="flex-grow text-slate-700">{prompt}</p>
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleMovePrompt(index, 'up')}
                                disabled={index === 0}
                                className="p-1 text-slate-400 hover:text-slate-700 disabled:text-slate-300 disabled:cursor-not-allowed"
                                title="Move Up"
                            >
                                <MoveUpIcon />
                            </button>
                            <button
                                onClick={() => handleMovePrompt(index, 'down')}
                                disabled={index === prompts.length - 1}
                                className="p-1 text-slate-400 hover:text-slate-700 disabled:text-slate-300 disabled:cursor-not-allowed"
                                title="Move Down"
                            >
                                <MoveDownIcon />
                            </button>
                            <button
                                onClick={() => handleDeletePrompt(index)}
                                className="p-1 text-red-500 hover:text-red-400"
                                title="Delete Prompt"
                            >
                                <DeleteIcon />
                            </button>
                        </div>
                    </div>
                ))
            ) : (
                <p className="text-sm text-slate-400 text-center py-4">Add AI suggestions or your own edits.</p>
            )}
        </div>
    </div>
  );
};

export default EditSequencer;