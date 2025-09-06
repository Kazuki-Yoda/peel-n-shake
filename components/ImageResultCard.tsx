import React, { useState, useRef, useEffect } from 'react';
import type { ProcessedImage } from '../types';
import { TwitterIcon, FacebookIcon, DownloadIcon, ErrorIcon } from './Icons';

interface ImageResultCardProps {
  image: ProcessedImage;
  falImage?: string | null;
  isProcessingFal?: boolean;
  falError?: string | null;
}

const ImageResultCard: React.FC<ImageResultCardProps> = ({ image, falImage, isProcessingFal, falError }) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPosition(percent);
  };
  
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    e.preventDefault();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true;
    e.preventDefault();
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };
  
  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      handleMove(e.clientX);
    };
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging.current || e.touches.length === 0) return;
      handleMove(e.touches[0].clientX);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = image.final;
    const safeName = image.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
    link.download = `peel-n-edit-gemini-${safeName}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleShare = (platform: 'twitter' | 'facebook') => {
    const appUrl = window.location.href;
    const text = encodeURIComponent('Check out this image I edited with Peel-n-Edit!');
    let shareUrl = '';

    if (platform === 'twitter') {
      shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(appUrl)}`;
    } else if (platform === 'facebook') {
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}`;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleFalDownload = () => {
    if (!falImage) return;
    const link = document.createElement('a');
    link.href = falImage;
    const safeName = image.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
    link.download = `peel-n-edit-fal-${safeName}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-4">
      <div
        ref={containerRef}
        className="relative w-full aspect-video rounded-lg overflow-hidden select-none cursor-ew-resize group bg-slate-100"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <img
          src={image.original}
          alt="Original"
          className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
          draggable={false}
        />
        <div
          className="absolute top-0 left-0 h-full w-full overflow-hidden pointer-events-none"
          style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
        >
          <img
            src={image.final}
            alt="Processed"
            className="absolute top-0 left-0 w-full h-full object-contain pointer-events-none"
            draggable={false}
          />
        </div>
        <div
          className="absolute top-0 bottom-0 w-1 bg-indigo-500/50 cursor-ew-resize pointer-events-none transition-opacity duration-300 opacity-50 group-hover:opacity-100"
          style={{ left: `calc(${sliderPosition}% - 2px)` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-white shadow-lg border-2 border-slate-200 flex items-center justify-center">
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4"></path>
            </svg>
          </div>
        </div>
        <div className="absolute top-2 left-2 bg-slate-800/60 text-white text-xs px-2 py-1 rounded">
          BEFORE
        </div>
        <div className="absolute top-2 right-2 bg-slate-800/60 text-white text-xs px-2 py-1 rounded">
          AFTER (Gemini)
        </div>
      </div>
      <div className="border-t border-slate-200 pt-4">
          <div className="flex items-center justify-center gap-4">
               <button
                  onClick={() => handleShare('twitter')}
                  className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 border border-slate-200 rounded-lg px-4 py-2 transition-colors duration-200"
                  aria-label="Share on Twitter"
                >
                  <TwitterIcon />
                  Share on Twitter
                </button>
                <button
                  onClick={() => handleShare('facebook')}
                  className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 border border-slate-200 rounded-lg px-4 py-2 transition-colors duration-200"
                  aria-label="Share on Facebook"
                >
                  <FacebookIcon />
                  Share on Facebook
                </button>
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 border border-transparent rounded-lg px-4 py-2 transition-colors duration-200"
                  aria-label="Download Gemini edit"
                >
                  <DownloadIcon />
                  Download Gemini Edit
                </button>
          </div>
      </div>
      <div className="border-t border-slate-200 pt-4">
        <h3 className="text-lg font-bold text-slate-700 text-center mb-4">Alternative Edit by Flux Pro</h3>
        <div className="bg-slate-50 p-4 rounded-lg min-h-[250px] flex items-center justify-center">
          {isProcessingFal && (
              <div className="text-center text-slate-600">
                <svg className="animate-spin mx-auto h-10 w-10 text-indigo-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p>Generating with Fal.ai...</p>
                <p className="text-xs text-slate-400 mt-1">This can take a moment.</p>
              </div>
          )}
          {falError && !isProcessingFal && (
            <div className="text-center text-red-600">
              <ErrorIcon className="h-10 w-10 mx-auto mb-3" />
              <p className="font-semibold">Generation Failed</p>
              <p className="text-sm">{falError}</p>
            </div>
          )}
          {falImage && !isProcessingFal && (
            <div className="flex flex-col items-center gap-4 w-full">
              <img 
                  src={falImage}
                  alt="Image processed by Fal.ai"
                  className="max-w-full max-h-96 object-contain rounded-md"
              />
              <button
                  onClick={handleFalDownload}
                  className="mt-2 inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 border border-transparent rounded-lg px-4 py-2 transition-colors duration-200"
                  aria-label="Download Fal.ai edit"
              >
                  <DownloadIcon />
                  Download Fal Edit
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageResultCard;
