import React, { useState, useRef } from 'react';
import { UploadCloud, AlertTriangle } from 'lucide-react';

export interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  label?: string;
  helperText?: string;
  className?: string;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onFilesSelected,
  accept,
  multiple = false,
  maxSizeMB = 50,
  label = 'Arrastra tus archivos aquí o haz clic para seleccionar',
  helperText,
  className = '',
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [sizeWarning, setSizeWarning] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList);
    setSizeWarning(null);

    const oversized = files.filter((f) => f.size > maxSizeMB * 1024 * 1024);
    if (oversized.length > 0) {
      setSizeWarning(
        `Aviso: ${oversized.length === 1 ? `El archivo "${oversized[0].name}" supera` : `${oversized.length} archivos superan`} los ${maxSizeMB} MB. El procesamiento en el navegador puede tardar unos segundos.`
      );
    }

    onFilesSelected(files);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    processFiles(e.dataTransfer.files);
  };

  return (
    <div className="w-full">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        className={`group relative flex flex-col items-center justify-center p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
          isDragOver
            ? 'border-[var(--accent-color)] bg-[var(--accent-subtle)] scale-[1.01]'
            : 'border-slate-300 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/40 hover:border-slate-400'
        } ${className}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => processFiles(e.target.files)}
          className="hidden"
          aria-label={label}
        />
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 text-[var(--accent-text)] shadow-xs mb-3 group-hover:scale-110 transition-transform">
          <UploadCloud className="w-6 h-6" />
        </div>
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 text-center">
          {label}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-1">
          {helperText ||
            (multiple
              ? `Varios archivos permitidos (máx. recomendado ${maxSizeMB} MB)`
              : `Hasta ${maxSizeMB} MB`)}
        </p>
      </div>

      {sizeWarning && (
        <div className="mt-2.5 flex items-start gap-2 p-3 text-xs bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl text-amber-800 dark:text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <span>{sizeWarning}</span>
        </div>
      )}
    </div>
  );
};
