
import React, { useState, useRef, useEffect } from 'react';
import type { ProcessedImage } from '../types';

interface ImageResultCardProps {
  image: ProcessedImage;
}

const ImageResultCard: React.FC<ImageResultCardProps> = ({ image }) => {
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

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-3">
      <h3 className="font-semibold text-slate-700 truncate" title={image.name}>
        {image.name}
      </h3>
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
          AFTER
        </div>
      </div>
    </div>
  );
};

export default ImageResultCard;
