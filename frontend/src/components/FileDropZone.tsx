'use client';

import { useState } from 'react';
import { File as FileIcon, Upload, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { REPORT_FILE_ACCEPT, REPORT_FILE_HINT, validateReportFile } from '@/lib/reportFiles';

interface FileDropZoneProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  disabled?: boolean;
}

// Pick a report by clicking, tapping or dragging it in. Invalid files are rejected with a message.
export default function FileDropZone({ file, onFileChange, disabled = false }: FileDropZoneProps) {
  const [dragging, setDragging] = useState(false);

  const takeFile = (candidate?: File) => {
    if (!candidate || disabled) return;
    const problem = validateReportFile(candidate);
    if (problem) {
      toast.error(problem);
      return;
    }
    onFileChange(candidate);
  };

  const handleDrop = (event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragging(false);
    if (event.dataTransfer.files.length > 1) {
      toast.error('Please upload one file at a time');
      return;
    }
    takeFile(event.dataTransfer.files[0]);
  };

  const stateClasses = dragging
    ? 'border-blue-500 bg-blue-50'
    : file
      ? 'border-green-400 bg-green-50'
      : 'border-gray-300 hover:border-blue-400';

  return (
    <div>
      <label
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`block border-2 border-dashed rounded-lg p-6 text-center transition-colors focus-within:ring-2 focus-within:ring-blue-500 ${stateClasses} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input
          type="file"
          accept={REPORT_FILE_ACCEPT}
          disabled={disabled}
          className="sr-only"
          onChange={(event) => {
            takeFile(event.target.files?.[0]);
            // Allows choosing the same file again after removing it.
            event.target.value = '';
          }}
        />
        <div className="pointer-events-none">
          {file ? (
            <>
              <FileIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900 break-all">{file.name}</p>
              <p className="text-xs text-gray-500 mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
              <p className="text-xs text-blue-600 mt-2">Click or drop another file to replace it</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-900">
                {dragging ? 'Drop the file here' : 'Click to choose a file, or drag it here'}
              </p>
              <p className="text-xs text-gray-500 mt-1">{REPORT_FILE_HINT}</p>
            </>
          )}
        </div>
      </label>
      {file && !disabled && (
        <button
          type="button"
          onClick={() => onFileChange(null)}
          className="mt-2 inline-flex items-center text-sm text-red-600 hover:text-red-700"
        >
          <X className="h-4 w-4 mr-1" />
          Remove file
        </button>
      )}
    </div>
  );
}
