import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Merge,
  Split,
  ArrowUp,
  ArrowDown,
  Trash2,
  Download,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  FileArchive,
  Layers,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Tabs } from '../../ui/Tabs';
import { Button } from '../../ui/Button';
import { Dropzone } from '../../ui/Dropzone';
import { useToast } from '../../ui/Toast';

interface MergeFileItem {
  id: string;
  file: File;
  name: string;
  size: number;
  pageCount: number;
}

interface PageThumbnail {
  pageNumber: number; // 1-indexed
  dataUrl: string;
  rotation: number; // 0, 90, 180, 270
}

export default function PdfMergeSplit() {
  const [activeTab, setActiveTab] = useState<'merge' | 'split'>('merge');

  // Merge state
  const [mergeFiles, setMergeFiles] = useState<MergeFileItem[]>([]);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeProgress, setMergeProgress] = useState(0);

  // Split state
  const [splitFile, setSplitFile] = useState<File | null>(null);
  const [splitDocPages, setSplitDocPages] = useState<number>(0);
  const [thumbnails, setThumbnails] = useState<PageThumbnail[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [pageRotations, setPageRotations] = useState<Map<number, number>>(new Map());
  const [rangeInput, setRangeInput] = useState('');
  const [splitMode, setSplitMode] = useState<'extract' | 'each' | 'everyN'>('extract');
  const [everyNCount, setEveryNCount] = useState(2);
  const [isSplitting, setIsSplitting] = useState(false);
  const [splitProgress, setSplitProgress] = useState(0);
  const [splitError, setSplitError] = useState<string | null>(null);

  const { success, error: toastError } = useToast();

  // Load PDF Lib dynamically
  const getPdfLib = async () => {
    return await import('pdf-lib');
  };

  // Load JSZip dynamically
  const getJSZip = async () => {
    const mod = await import('jszip');
    return mod.default || mod;
  };

  // ----------------------------------------------------
  // MERGE FUNCTIONS
  // ----------------------------------------------------

  const handleAddMergeFiles = async (files: File[]) => {
    const pdfFiles = files.filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );

    if (pdfFiles.length === 0) {
      toastError('Por favor selecciona archivos en formato PDF');
      return;
    }

    try {
      const { PDFDocument } = await getPdfLib();
      const newItems: MergeFileItem[] = [];

      for (const file of pdfFiles) {
        try {
          const buffer = await file.arrayBuffer();
          const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
          newItems.push({
            id: Math.random().toString(36).substring(2, 9),
            file,
            name: file.name,
            size: file.size,
            pageCount: doc.getPageCount(),
          });
        } catch {
          toastError(`No se pudo leer el archivo "${file.name}". Puede estar dañado.`);
        }
      }

      setMergeFiles((prev) => [...prev, ...newItems]);
      success(`${newItems.length} PDF(s) añadido(s)`);
    } catch (err) {
      console.error(err);
      toastError('Error al procesar archivos PDF');
    }
  };

  const moveMergeItem = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= mergeFiles.length) return;
    const copy = [...mergeFiles];
    const [item] = copy.splice(idx, 1);
    copy.splice(targetIdx, 0, item);
    setMergeFiles(copy);
  };

  const removeMergeItem = (id: string) => {
    setMergeFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const handleExecuteMerge = async () => {
    if (mergeFiles.length < 2) {
      toastError('Añade al menos 2 archivos PDF para unir');
      return;
    }

    setIsMerging(true);
    setMergeProgress(10);

    try {
      const { PDFDocument } = await getPdfLib();
      const mergedPdf = await PDFDocument.create();

      const totalFiles = mergeFiles.length;
      for (let i = 0; i < totalFiles; i++) {
        const item = mergeFiles[i];
        const buffer = await item.file.arrayBuffer();
        const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(doc, doc.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));

        setMergeProgress(Math.round(((i + 1) / totalFiles) * 80) + 10);
      }

      const mergedPdfBytes = await mergedPdf.save();
      setMergeProgress(100);

      // Trigger download
      const blob = new Blob([new Uint8Array(mergedPdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pdf-unido-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      success('¡PDFs unidos con éxito!');
    } catch (err: any) {
      console.error(err);
      toastError('Error al unir PDFs: ' + (err.message || ''));
    } finally {
      setIsMerging(false);
      setMergeProgress(0);
    }
  };

  // ----------------------------------------------------
  // SPLIT FUNCTIONS
  // ----------------------------------------------------

  const handleSelectSplitFile = async (files: File[]) => {
    const file = files[0];
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
      toastError('Selecciona un archivo PDF válido');
      return;
    }

    setSplitFile(file);
    setThumbnails([]);
    setSelectedPages(new Set());
    setPageRotations(new Map());
    setSplitError(null);

    try {
      const { PDFDocument } = await getPdfLib();
      const buffer = await file.arrayBuffer();
      const doc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const count = doc.getPageCount();
      setSplitDocPages(count);

      // Select first page by default
      setSelectedPages(new Set([1]));

      // Render thumbnails with pdfjs-dist
      renderThumbnails(file, count);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('password') || err.message?.includes('encrypt')) {
        setSplitError('El archivo PDF está protegido con contraseña. Desbloquéalo antes de dividirlo.');
      } else {
        setSplitError('No se pudo procesar el archivo PDF. Puede estar dañado.');
      }
    }
  };

  const renderThumbnails = async (file: File, pageCount: number) => {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      // Set worker source
      try {
        pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.mjs',
          import.meta.url
        ).toString();
      } catch {
        // Fallback
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.3.136/pdf.worker.min.mjs';
      }

      const fileBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: fileBuffer });
      const pdfDoc = await loadingTask.promise;

      const thumbs: PageThumbnail[] = [];
      const renderCount = Math.min(pageCount, 40); // Render first 40 pages smoothly

      for (let i = 1; i <= renderCount; i++) {
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 0.35 });
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (ctx) {
          await (page as any).render({ canvasContext: ctx, viewport, canvas }).promise;
          thumbs.push({
            pageNumber: i,
            dataUrl: canvas.toDataURL('image/jpeg', 0.8),
            rotation: 0,
          });
          setThumbnails([...thumbs]);
        }
      }
    } catch (err) {
      console.warn('Miniaturas no disponibles o error de render:', err);
    }
  };

  const togglePageSelection = (pageNum: number) => {
    const next = new Set(selectedPages);
    if (next.has(pageNum)) {
      next.delete(pageNum);
    } else {
      next.add(pageNum);
    }
    setSelectedPages(next);
  };

  const handleSelectAllPages = () => {
    const all = new Set<number>();
    for (let i = 1; i <= splitDocPages; i++) all.add(i);
    setSelectedPages(all);
  };

  const handleClearSelection = () => {
    setSelectedPages(new Set());
  };

  // Parse text range (e.g., "1-3, 5, 8-10")
  const handleApplyRange = () => {
    if (!rangeInput.trim()) return;
    const parts = rangeInput.split(',');
    const newSelected = new Set<number>();

    for (const part of parts) {
      const clean = part.trim();
      if (clean.includes('-')) {
        const [startStr, endStr] = clean.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          for (let p = Math.min(start, end); p <= Math.max(start, end); p++) {
            if (p >= 1 && p <= splitDocPages) newSelected.add(p);
          }
        }
      } else {
        const p = parseInt(clean, 10);
        if (!isNaN(p) && p >= 1 && p <= splitDocPages) {
          newSelected.add(p);
        }
      }
    }

    setSelectedPages(newSelected);
    success(`Rango aplicado: ${newSelected.size} páginas seleccionadas`);
  };

  // Rotate a page 90 degrees
  const handleRotatePage = (pageNum: number) => {
    const current = pageRotations.get(pageNum) || 0;
    const nextRot = (current + 90) % 360;
    const nextMap = new Map(pageRotations);
    nextMap.set(pageNum, nextRot);
    setPageRotations(nextMap);
  };

  // Execute Split
  const handleExecuteSplit = async () => {
    if (!splitFile) return;

    setIsSplitting(true);
    setSplitProgress(10);

    try {
      const { PDFDocument, degrees } = await getPdfLib();
      const buffer = await splitFile.arrayBuffer();
      const sourceDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

      // Mode 1: Extract selected pages into one PDF
      if (splitMode === 'extract') {
        if (selectedPages.size === 0) {
          toastError('Selecciona al menos una página para extraer');
          setIsSplitting(false);
          return;
        }

        const newDoc = await PDFDocument.create();
        const pagesToExtract = Array.from(selectedPages).sort((a, b) => a - b);
        const indices = pagesToExtract.map((p) => p - 1);

        const copiedPages = await newDoc.copyPages(sourceDoc, indices);
        copiedPages.forEach((page, idx) => {
          const originalPageNum = pagesToExtract[idx];
          const rot = pageRotations.get(originalPageNum) || 0;
          if (rot !== 0) {
            page.setRotation(degrees((page.getRotation().angle + rot) % 360));
          }
          newDoc.addPage(page);
        });

        const pdfBytes = await newDoc.save();
        setSplitProgress(100);

        const blob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `paginas-extraidas-${splitFile.name}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        success('Páginas extraídas y descargadas con éxito');
      }

      // Mode 2: Split every single page into separate PDF (ZIP download)
      else if (splitMode === 'each') {
        const JSZip = await getJSZip();
        const zip = new JSZip();
        const total = sourceDoc.getPageCount();

        for (let i = 0; i < total; i++) {
          const pageNum = i + 1;
          const singleDoc = await PDFDocument.create();
          const [copiedPage] = await singleDoc.copyPages(sourceDoc, [i]);
          const rot = pageRotations.get(pageNum) || 0;
          if (rot !== 0) {
            copiedPage.setRotation(degrees((copiedPage.getRotation().angle + rot) % 360));
          }
          singleDoc.addPage(copiedPage);

          const bytes = await singleDoc.save();
          zip.file(`pagina_${String(pageNum).padStart(3, '0')}.pdf`, bytes);
          setSplitProgress(Math.round(((i + 1) / total) * 80) + 10);
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        setSplitProgress(100);

        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `paginas-separadas-${splitFile.name.replace('.pdf', '')}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        success(`¡${total} páginas divididas y descargadas en archivo ZIP!`);
      }

      // Mode 3: Split every N pages into separate PDFs (ZIP download)
      else if (splitMode === 'everyN') {
        const n = Math.max(1, everyNCount);
        const JSZip = await getJSZip();
        const zip = new JSZip();
        const total = sourceDoc.getPageCount();
        const groupCount = Math.ceil(total / n);

        for (let g = 0; g < groupCount; g++) {
          const groupDoc = await PDFDocument.create();
          const start = g * n;
          const end = Math.min(start + n, total);
          const indices: number[] = [];
          for (let p = start; p < end; p++) indices.push(p);

          const copied = await groupDoc.copyPages(sourceDoc, indices);
          copied.forEach((page, idx) => {
            const pageNum = start + idx + 1;
            const rot = pageRotations.get(pageNum) || 0;
            if (rot !== 0) {
              page.setRotation(degrees((page.getRotation().angle + rot) % 360));
            }
            groupDoc.addPage(page);
          });

          const bytes = await groupDoc.save();
          zip.file(`parte_${g + 1}_paginas_${start + 1}-${end}.pdf`, bytes);
          setSplitProgress(Math.round(((g + 1) / groupCount) * 80) + 10);
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        setSplitProgress(100);

        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dividido-cada-${n}-paginas.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        success(`PDF dividido cada ${n} páginas en ZIP`);
      }
    } catch (err: any) {
      console.error(err);
      toastError('Error al dividir el PDF: ' + (err.message || ''));
    } finally {
      setIsSplitting(false);
      setSplitProgress(0);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[var(--accent-text)]" />
            Unir y Dividir Documentos PDF
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Combina varios PDFs, extrae páginas seleccionadas o divide por rangos. 100% privado en tu navegador.
          </p>
        </div>

        <Tabs
          tabs={[
            { id: 'merge', label: 'Unir PDFs', icon: <Merge className="w-4 h-4" /> },
            { id: 'split', label: 'Dividir y Extraer', icon: <Split className="w-4 h-4" /> },
          ]}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as any)}
        />
      </div>

      {/* Privacy Notice Banner */}
      <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
        <span>
          <strong>Privacidad garantizada:</strong> Tus documentos nunca salen de tu ordenador ni se transfieren por internet; todo el procesamiento se realiza localmente en la memoria de tu navegador.
        </span>
      </div>

      {/* TAB 1: UNIR PDF */}
      {activeTab === 'merge' && (
        <div className="space-y-6">
          <Dropzone
            onFilesSelected={handleAddMergeFiles}
            multiple
            accept=".pdf,application/pdf"
            label="Arrastra varios archivos PDF aquí para unirlos"
            helperText="Puedes seleccionar varios a la vez o agregarlos sucesivamente"
          />

          {mergeFiles.length > 0 && (
            <Card className="p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Archivos a combinar ({mergeFiles.length})
                </span>
                <span className="text-xs text-slate-400">
                  Total:{' '}
                  {mergeFiles.reduce((acc, f) => acc + f.pageCount, 0)} páginas •{' '}
                  {(mergeFiles.reduce((acc, f) => acc + f.size, 0) / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>

              {/* List with Reorder Buttons */}
              <div className="space-y-2">
                {mergeFiles.map((item, idx) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-bold text-slate-400 w-5 text-right">{idx + 1}.</span>
                      <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {item.pageCount} páginas • {(item.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => moveMergeItem(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-20 cursor-pointer rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                        title="Subir posición"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => moveMergeItem(idx, 'down')}
                        disabled={idx === mergeFiles.length - 1}
                        className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 disabled:opacity-20 cursor-pointer rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700"
                        title="Bajar posición"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeMergeItem(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 cursor-pointer rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 ml-1"
                        title="Eliminar de la lista"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress bar if merging */}
              {isMerging && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <span>Uniendo documentos en memoria...</span>
                    <span>{mergeProgress}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent-color)] transition-all duration-200"
                      style={{ width: `${mergeProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Download Action */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <Button
                  size="md"
                  variant="primary"
                  loading={isMerging}
                  icon={<Download className="w-4 h-4" />}
                  onClick={handleExecuteMerge}
                >
                  Unir y Descargar PDF
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* TAB 2: DIVIDIR PDF */}
      {activeTab === 'split' && (
        <div className="space-y-6">
          {!splitFile ? (
            <Dropzone
              onFilesSelected={handleSelectSplitFile}
              accept=".pdf,application/pdf"
              label="Arrastra un PDF aquí para inspeccionar páginas y dividir"
              helperText="Generará miniaturas visuales de cada página automáticamente"
            />
          ) : (
            <Card className="p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-500">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {splitFile.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {splitDocPages} páginas • {(splitFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSplitFile(null);
                    setThumbnails([]);
                  }}
                >
                  Cambiar archivo
                </Button>
              </div>

              {/* Split Mode Options */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <button
                  onClick={() => setSplitMode('extract')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                    splitMode === 'extract'
                      ? 'bg-[var(--accent-subtle)] border-[var(--accent-border)] text-[var(--accent-text)] font-bold'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <p className="font-bold">1. Extraer selección</p>
                  <p className="text-[11px] font-normal opacity-80 mt-0.5">
                    Un nuevo PDF con las páginas seleccionadas ({selectedPages.size})
                  </p>
                </button>

                <button
                  onClick={() => setSplitMode('each')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                    splitMode === 'each'
                      ? 'bg-[var(--accent-subtle)] border-[var(--accent-border)] text-[var(--accent-text)] font-bold'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <p className="font-bold">2. Dividir cada página</p>
                  <p className="text-[11px] font-normal opacity-80 mt-0.5">
                    Descarga todas las páginas separadas en un archivo ZIP
                  </p>
                </button>

                <button
                  onClick={() => setSplitMode('everyN')}
                  className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                    splitMode === 'everyN'
                      ? 'bg-[var(--accent-subtle)] border-[var(--accent-border)] text-[var(--accent-text)] font-bold'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <p className="font-bold">3. Dividir cada N páginas</p>
                  <div className="flex items-center gap-1.5 mt-1 font-normal">
                    <span>Cada</span>
                    <input
                      type="number"
                      min="1"
                      max={splitDocPages}
                      value={everyNCount}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setEveryNCount(Math.max(1, Number(e.target.value) || 1))}
                      className="w-12 px-1 py-0.5 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-center text-xs font-bold"
                    />
                    <span>páginas en ZIP</span>
                  </div>
                </button>
              </div>

              {/* Range Selector Toolbar */}
              {splitMode === 'extract' && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={rangeInput}
                      onChange={(e) => setRangeInput(e.target.value)}
                      placeholder="Ej: 1-3, 5, 8-10"
                      className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 w-44 font-mono"
                    />
                    <Button size="sm" variant="outline" onClick={handleApplyRange}>
                      Aplicar rango
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={handleSelectAllPages}>
                      Seleccionar todas
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleClearSelection}>
                      Deseleccionar
                    </Button>
                  </div>
                </div>
              )}

              {/* Visual Page Thumbnails Grid */}
              <div className="pt-2">
                <span className="text-xs font-bold uppercase text-slate-400 block mb-3">
                  Miniaturas de páginas (haz clic para marcar/desmarcar o rotar)
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-96 overflow-y-auto p-1">
                  {Array.from({ length: splitDocPages }, (_, i) => i + 1).map((pageNum) => {
                    const isSelected = selectedPages.has(pageNum);
                    const thumb = thumbnails.find((t) => t.pageNumber === pageNum);
                    const rotation = pageRotations.get(pageNum) || 0;

                    return (
                      <div
                        key={pageNum}
                        onClick={() => togglePageSelection(pageNum)}
                        className={`group relative flex flex-col items-center p-2 rounded-2xl border transition-all cursor-pointer select-none ${
                          isSelected
                            ? 'border-[var(--accent-color)] bg-[var(--accent-subtle)] ring-2 ring-[var(--accent-ring)]'
                            : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                        }`}
                      >
                        {/* Page preview canvas / image */}
                        <div className="w-full h-32 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center relative">
                          {thumb ? (
                            <img
                              src={thumb.dataUrl}
                              alt={`Página ${pageNum}`}
                              className="max-h-full max-w-full object-contain transition-transform duration-200"
                              style={{ transform: `rotate(${rotation}deg)` }}
                            />
                          ) : (
                            <div className="text-center p-2">
                              <FileText className="w-6 h-6 text-slate-300 mx-auto" />
                              <span className="text-[10px] text-slate-400 mt-1 block">
                                Pág. {pageNum}
                              </span>
                            </div>
                          )}

                          {/* Rotate Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRotatePage(pageNum);
                            }}
                            className="absolute bottom-1 right-1 p-1 bg-black/60 hover:bg-black/80 text-white rounded-lg opacity-80 group-hover:opacity-100 transition"
                            title="Rotar 90°"
                          >
                            <RotateCw className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between w-full mt-2 px-1 text-xs">
                          <span className="font-bold text-slate-700 dark:text-slate-300">
                            #{pageNum}
                          </span>
                          <span
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                              isSelected
                                ? 'bg-[var(--accent-color)] text-white'
                                : 'border border-slate-300 dark:border-slate-600'
                            }`}
                          >
                            {isSelected ? '✓' : ''}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Progress Bar */}
              {isSplitting && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <span>Generando documentos...</span>
                    <span>{splitProgress}%</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent-color)] transition-all duration-200"
                      style={{ width: `${splitProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <Button
                  size="md"
                  variant="primary"
                  loading={isSplitting}
                  icon={<Download className="w-4 h-4" />}
                  onClick={handleExecuteSplit}
                >
                  {splitMode === 'extract'
                    ? `Extraer ${selectedPages.size} página(s) seleccionada(s)`
                    : splitMode === 'each'
                    ? `Dividir ${splitDocPages} páginas en ZIP`
                    : `Dividir cada ${everyNCount} páginas en ZIP`}
                </Button>
              </div>
            </Card>
          )}

          {splitError && (
            <div className="flex items-center gap-2 p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl text-rose-800 dark:text-rose-200 text-xs">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <span>{splitError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
