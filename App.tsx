import React, { useState, useCallback } from 'react';
import ImageResultCard from './components/ImageResultCard';
import { applyEditSequence, getEditSuggestions } from './services/geminiService';
import { requestFalImageEdit } from './services/falRequest';
import type { ProcessedImage, EditSuggestionCategories } from './types';
import { LogoIcon } from './components/Icons';
import WelcomeScreen from './components/WelcomeScreen';
import MainEditor from './components/MainEditor';

type AppState = 'upload' | 'edit' | 'process' | 'results';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('upload');
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [processedImage, setProcessedImage] = useState<ProcessedImage | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // State for Fal.ai processing
  const [falProcessedImageUrl, setFalProcessedImageUrl] = useState<string | null>(null);
  const [isProcessingFal, setIsProcessingFal] = useState(false);
  const [falError, setFalError] = useState<string | null>(null);

  const [editSuggestions, setEditSuggestions] = useState<EditSuggestionCategories | null>(null);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);

  const handleFileSelected = useCallback(async (file: File) => {
    setOriginalFile(file);
    setProcessedImage(null);
    setError(null);
    setEditSuggestions(null);
    setSuggestionError(null);
    setFalProcessedImageUrl(null);
    setFalError(null);
    setAppState('edit');
    
    if (file) {
      setIsSuggesting(true);
      try {
        // The callback will be fired multiple times: once with text, then for each preview.
        const handleSuggestionUpdate = (updatedSuggestions: EditSuggestionCategories) => {
          setEditSuggestions(updatedSuggestions);
        };
        await getEditSuggestions(file, handleSuggestionUpdate);
      } catch (err) {
        console.error("Failed to get suggestions:", err);
        setSuggestionError("Could not generate suggestions for the image.");
      } finally {
        setIsSuggesting(false);
      }
    }
  }, []);

  const handleProcessImage = useCallback(async (finalPrompts: string[]) => {
    if (!originalFile || finalPrompts.length === 0) {
      setError("Please select an image and add at least one edit prompt.");
      return;
    }

    setAppState('process');
    setIsLoading(true);
    setIsProcessingFal(true);
    setError(null);
    setFalError(null);
    setProcessedImage(null);
    setFalProcessedImageUrl(null);

    try {
      const originalImageBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(originalFile);
      });

      // --- Start Fal.ai process (non-blocking) ---
      const falPrompt = finalPrompts.join('. ');
      requestFalImageEdit('fal-ai/flux-pro/kontext/max', falPrompt, originalImageBase64)
          .then(url => {
              if (url) {
                  setFalProcessedImageUrl(url);
              } else {
                  throw new Error("Fal.ai returned an empty URL.");
              }
          })
          .catch(e => {
              console.error('Fal.ai processing failed:', e);
              setFalError('An error occurred generating the alternative edit.');
          })
          .finally(() => {
              setIsProcessingFal(false);
          });
      
      // --- Start Gemini process (blocking for UI transition) ---
      setProcessingStatus(`Processing ${originalFile.name} with Gemini...`);
      const finalImageBase64 = await applyEditSequence(originalFile, finalPrompts, (promptIndex) => {
         setProcessingStatus(`Editing ${originalFile.name} with prompt ${promptIndex + 1}: "${finalPrompts[promptIndex]}"`);
      });
      
      setProcessedImage({
        id: originalFile.name + Date.now(),
        original: originalImageBase64,
        final: finalImageBase64,
        name: originalFile.name,
      });

    } catch (e) {
      console.error(`Failed to process ${originalFile.name}:`, e);
      setError(`An error occurred while processing ${originalFile.name}. Please check the console for details.`);
    }
    
    // Transition UI after Gemini is done. Fal will update its section when it finishes.
    setAppState('results');
    setIsLoading(false);
    setProcessingStatus(null);
  }, [originalFile]);
  
  const renderContent = () => {
    switch (appState) {
      case 'upload':
        return <WelcomeScreen onFileSelected={handleFileSelected} />;
      case 'edit':
        if (!originalFile) return null;
        return (
          <MainEditor
            suggestions={editSuggestions}
            isLoading={isSuggesting}
            error={suggestionError}
            file={originalFile}
            onProcess={handleProcessImage}
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
               <p className="text-slate-500 mt-2">This may take a few moments. Please wait.</p>
            </div>
          </div>
        );
      case 'results':
        return (
          <div className="max-w-4xl mx-auto">
            {processedImage && (
              <ImageResultCard
                image={processedImage}
                falImage={falProcessedImageUrl}
                isProcessingFal={isProcessingFal}
                falError={falError}
              />
            )}
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
              Peel-n-Edit
            </h1>
          </div>
        </header>

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
