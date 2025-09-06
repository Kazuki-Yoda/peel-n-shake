
import React, { useState, useCallback } from 'react';
import ImageResultCard from './components/ImageResultCard';
import { applyEditSequence, getEditSuggestions } from './services/geminiService';
import type { ProcessedImage, EditSuggestionCategories } from './types';
import { LogoIcon, ResetIcon } from './components/Icons';
import WelcomeScreen from './components/WelcomeScreen';
import MainEditor from './components/MainEditor';

type AppState = 'upload' | 'edit' | 'process' | 'results';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('upload');
  const [originalFiles, setOriginalFiles] = useState<File[]>([]);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [editSuggestions, setEditSuggestions] = useState<EditSuggestionCategories | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  const handleFilesSelected = useCallback(async (files: File[]) => {
    setOriginalFiles(files);
    setProcessedImages([]);
    setError(null);
    setEditSuggestions(null);
    setSuggestionError(null);
    setAppState('edit');
    
    if (files.length > 0) {
      setIsSuggesting(true);
      try {
        // The callback will be fired multiple times: once with text, then for each preview.
        const handleSuggestionUpdate = (updatedSuggestions: EditSuggestionCategories) => {
          setEditSuggestions(updatedSuggestions);
        };
        await getEditSuggestions(files[0], handleSuggestionUpdate);
      } catch (err) {
        console.error("Failed to get suggestions:", err);
        setSuggestionError("Could not generate suggestions for the image.");
      } finally {
        setIsSuggesting(false);
      }
    }
  }, []);

  const handleProcessImages = useCallback(async (finalPrompts: string[]) => {
    if (originalFiles.length === 0 || finalPrompts.length === 0) {
      setError("Please select at least one image and add at least one edit prompt.");
      return;
    }

    setAppState('process');
    setIsLoading(true);
    setError(null);
    setProcessedImages([]);

    const results: ProcessedImage[] = [];

    for (let i = 0; i < originalFiles.length; i++) {
      const file = originalFiles[i];
      try {
        setProcessingStatus(`Processing ${file.name} (image ${i + 1} of ${originalFiles.length})...`);
        const finalImageBase64 = await applyEditSequence(file, finalPrompts, (promptIndex) => {
           setProcessingStatus(`Editing ${file.name} with prompt ${promptIndex + 1}: "${finalPrompts[promptIndex]}"`);
        });

        const originalImageBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
        
        results.push({
          id: file.name + Date.now(),
          original: originalImageBase64,
          final: finalImageBase64,
          name: file.name,
        });

        setProcessedImages([...results]);

      } catch (e) {
        console.error(`Failed to process ${file.name}:`, e);
        setError(`An error occurred while processing ${file.name}. Please check the console for details.`);
        break;
      }
    }
    setAppState('results');
    setIsLoading(false);
    setProcessingStatus(null);
  }, [originalFiles]);

  const handleStartOver = () => {
    setAppState('upload');
    setOriginalFiles([]);
    setProcessedImages([]);
    setError(null);
    setEditSuggestions(null);
    setSuggestionError(null);
    setIsLoading(false);
    setProcessingStatus(null);
  };
  
  const renderContent = () => {
    switch (appState) {
      case 'upload':
        return <WelcomeScreen onFilesSelected={handleFilesSelected} />;
      case 'edit':
        return (
          <MainEditor
            suggestions={editSuggestions}
            isLoading={isSuggesting}
            error={suggestionError}
            files={originalFiles}
            onProcess={handleProcessImages}
          />
        );
      case 'process':
        return (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl">
               <svg className="animate-spin mx-auto h-12 w-12 text-indigo-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              <p className="text-xl font-semibold text-slate-700">{processingStatus || "Initializing..."}</p>
               <p className="text-slate-500 mt-2">This may take a few moments per image. Please wait.</p>
            </div>
          </div>
        );
      case 'results':
        return (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {processedImages.map((image) => (
              <ImageResultCard key={image.id} image={image} />
            ))}
          </div>
        );
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 selection:bg-indigo-500 selection:text-white">
      <main className="container mx-auto p-4 md:p-8">
        <header className="text-center mb-8 md:mb-12">
          <div className="flex items-center justify-center gap-4 mb-4">
            <LogoIcon />
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-500 to-cyan-500 text-transparent bg-clip-text">
              Gemini Image Sequencer
            </h1>
          </div>
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto">
            Upload your photos, pick AI suggestions, refine your edits, and transform them all in one go.
          </p>
        </header>

        {appState !== 'upload' && appState !== 'process' &&(
          <div className="flex justify-end mb-6">
            <button
              onClick={handleStartOver}
              className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-indigo-600 bg-white hover:bg-indigo-50 border border-slate-200 rounded-lg px-4 py-2 transition-colors duration-200"
            >
              <ResetIcon className="w-4 h-4" />
              Start Over
            </button>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {renderContent()}

      </main>
    </div>
  );
};

export default App;
