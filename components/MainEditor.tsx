
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { EditSuggestionCategories, SuggestionPreview } from '../types';
import { SparklesIcon, AddIcon, ErrorIcon } from './Icons';
import EditSequencer from './EditSequencer';

interface MainEditorProps {
  suggestions: EditSuggestionCategories | null;
  isLoading: boolean;
  error: string | null;
  file: File;
  onProcess: (prompts: string[]) => void;
}

const SkeletonLoader: React.FC = () => (
  <div className="space-y-8">
    {[...Array(3)].map((_, i) => (
      <div key={i}>
        <div className="bg-slate-200 h-5 w-1/3 rounded-md animate-pulse mb-3"></div>
        <div className="space-y-2">
          {[...Array(3)].map((_, j) => (
             <div key={j} className="flex items-center gap-4 p-4 rounded-lg bg-slate-100 animate-pulse">
                <div className="w-16 h-16 bg-slate-200 rounded-md flex-shrink-0"></div>
                <div className="h-4 bg-slate-200 rounded w-full"></div>
                <div className="w-8 h-8 bg-slate-200 rounded-full flex-shrink-0 ml-auto"></div>
             </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);


const MainEditor: React.FC<MainEditorProps> = ({ suggestions, isLoading, error, file, onProcess }) => {
  const [prompts, setPrompts] = useState<string[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [hoveredImage, setHoveredImage] = useState<{ src: string; top: number; left: number } | null>(null);


  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  const handleAddSuggestion = (suggestion: string) => {
    setPrompts(prev => [...prev, suggestion]);
  };

  const handleSuggestionMouseEnter = (e: React.MouseEvent<HTMLButtonElement>, item: SuggestionPreview) => {
    if (item.previewImage && item.previewImage !== 'error' && item.previewImage !== '') {
        const rect = e.currentTarget.getBoundingClientRect();
        // Position hover preview relative to the element, with a small offset
        setHoveredImage({
            src: item.previewImage,
            top: rect.top,
            left: rect.right + 12,
        });
    }
  };

  const handleSuggestionMouseLeave = () => {
    setHoveredImage(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {hoveredImage && createPortal(
        <div
            className="fixed z-50 pointer-events-none p-2 bg-white rounded-xl shadow-2xl border border-slate-200"
            style={{
                left: `${hoveredImage.left}px`,
                top: `${hoveredImage.top}px`,
            }}
        >
            <img
                src={hoveredImage.src}
                alt="Suggestion preview"
                className="rounded-lg w-64 h-64 object-cover"
            />
        </div>,
        document.body
      )}
      {/* Left Column: Suggestions */}
      <div className="lg:col-span-7">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-2xl font-bold mb-6 text-slate-800 flex items-center gap-3">
            <span className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
              <SparklesIcon className="w-6 h-6"/>
            </span>
            AI Suggestions
          </h2>
          {isLoading && !suggestions && <SkeletonLoader />}
          {error && !isLoading && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="font-semibold">Suggestion Error</p>
                <p>{error}</p>
            </div>
          )}
          
          {suggestions && (
            <div className="space-y-8">
              {Object.entries(suggestions).map(([category, items]) => (
                <div key={category}>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 capitalize">{category}</h3>
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <button
                        key={`${category}-${index}`}
                        onClick={() => handleAddSuggestion(item.prompt)}
                        onMouseEnter={(e) => handleSuggestionMouseEnter(e, item)}
                        onMouseLeave={handleSuggestionMouseLeave}
                        className="w-full flex items-center text-left p-4 rounded-lg bg-slate-50 group transition-all duration-200 hover:bg-indigo-50 hover:shadow-sm"
                        aria-label={`Add suggestion: ${item.prompt}`}
                      >
                        <div className="w-16 h-16 rounded-md object-cover flex-shrink-0 bg-slate-100 border border-slate-200 flex items-center justify-center">
                          {item.previewImage === '' ? (
                            <div className="w-full h-full bg-slate-200 animate-pulse rounded-md"></div>
                          ) : item.previewImage === 'error' ? (
                            <ErrorIcon className="w-8 h-8 text-red-400" />
                          ) : (
                            <img
                                src={item.previewImage}
                                alt={`Preview of: ${item.prompt}`}
                                className="w-full h-full rounded-md object-cover"
                            />
                          )}
                        </div>
                        <p className="font-medium text-slate-700 px-4 flex-grow">{item.prompt}</p>
                        <div
                          className="flex-shrink-0 p-2 ml-auto bg-white group-hover:bg-indigo-100 text-indigo-500 rounded-full transition-all duration-200 border border-slate-200 group-hover:border-indigo-300"
                        >
                          <AddIcon className="w-4 h-4" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Control Panel */}
      <div className="lg:col-span-5 self-start sticky top-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6">
                <EditSequencer prompts={prompts} setPrompts={setPrompts} />
            </div>

            <div className="border-t border-slate-200 px-6 py-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                    Preview
                </h3>
            </div>

            <div className="px-6 pb-6">
                {previewUrl ? (
                <div className="bg-slate-100 p-2 rounded-lg">
                    <img
                        src={previewUrl}
                        alt="Preview of the selected image"
                        className="w-full h-auto object-contain rounded-md max-h-[250px]"
                    />
                </div>
                ) : (
                <div className="w-full aspect-[4/3] bg-slate-100 rounded-lg animate-pulse"></div>
                )}
            </div>

            <div className="p-6 bg-slate-50/50 border-t border-slate-200">
                <button
                    onClick={() => onProcess(prompts)}
                    disabled={prompts.length === 0}
                    className="w-full inline-flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:scale-100 shadow-lg shadow-indigo-600/20 text-base"
                >
                    <SparklesIcon />
                    Apply Edits to Image
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MainEditor;
