
import React, { useCallback, useState } from 'react';
import { UploadIcon } from './Icons';

interface WelcomeScreenProps {
  onFilesSelected: (files: File[]) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onFilesSelected }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      onFilesSelected(Array.from(files));
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      onFilesSelected(Array.from(files));
    }
  }, [onFilesSelected]);

  const dropzoneClasses = `flex flex-col items-center justify-center text-center p-8 bg-white rounded-2xl border-2 border-dashed min-h-[60vh] transition-colors duration-300 ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200'}`;

  return (
    <div className="w-full">
      <label
        htmlFor="file-upload"
        className={dropzoneClasses}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          id="file-upload"
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="flex flex-col items-center text-slate-500 pointer-events-none">
            <UploadIcon className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-2xl font-bold text-slate-700">Drag & drop photos</h3>
            <p className="text-slate-500 mt-2">or <span className="font-semibold text-indigo-600">click to browse</span></p>
        </div>
      </label>
    </div>
  );
};

export default WelcomeScreen;
