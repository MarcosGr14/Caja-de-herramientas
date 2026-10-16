import React, { useState, useMemo } from 'react';
import {
  Binary,
  ArrowRight,
  Download,
  Image as ImageIcon,
  FileCode,
  AlertCircle,
  Copy,
  Trash2,
  Check,
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Tabs } from '../../ui/Tabs';
import { Button } from '../../ui/Button';
import { CopyButton } from '../../ui/CopyButton';
import { Dropzone } from '../../ui/Dropzone';
import { useToast } from '../../ui/Toast';

// UTF-8 safe encode
function utf8ToBase64(str: string, urlSafe = false): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  let base64 = btoa(binary);
  if (urlSafe) {
    base64 = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  return base64;
}

// UTF-8 safe decode
function base64ToUtf8(b64: string): { text: string; error?: string } {
  try {
    let clean = b64.trim();
    // Support URL-safe
    clean = clean.replace(/-/g, '+').replace(/_/g, '/');
    while (clean.length % 4 !== 0) {
      clean += '=';
    }
    const binary = atob(clean);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const decoder = new TextDecoder('utf-8', { fatal: true });
    return { text: decoder.decode(bytes) };
  } catch (err: unknown) {
    return {
      text: '',
      error: 'La cadena ingresada no es un Base64 válido o contiene caracteres corruptos.',
    };
  }
}

export default function Base64Tool() {
  const [activeTab, setActiveTab] = useState<'encode' | 'decode' | 'file'>('encode');
  const [inputText, setInputText] = useState('¡Hola! Herramientas 100% en el navegador con soporte de tildes, ñ y emojis 🎉');
  const [urlSafe, setUrlSafe] = useState(false);
  const [decodedInput, setDecodedInput] = useState('');
  
  // File to Base64 states
  const [fileData, setFileData] = useState<{
    name: string;
    size: number;
    mime: string;
    base64: string;
    dataUri: string;
  } | null>(null);

  // Base64 to file download state
  const [downloadFileName, setDownloadFileName] = useState('archivo-decodificado.bin');
  const [downloadMime, setDownloadMime] = useState('application/octet-stream');

  const { success, error: toastError } = useToast();

  // Encode result
  const encodedResult = useMemo(() => {
    if (!inputText) return '';
    try {
      return utf8ToBase64(inputText, urlSafe);
    } catch {
      return 'Error al codificar el texto.';
    }
  }, [inputText, urlSafe]);

  // Decode result
  const decodedResult = useMemo(() => {
    if (!decodedInput.trim()) return { text: '', error: undefined };
    // Check if input has data URI prefix
    let clean = decodedInput.trim();
    const match = clean.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (match) {
      clean = match[2];
    }
    return base64ToUtf8(clean);
  }, [decodedInput]);

  // Handle file to base64
  const handleFile = (files: File[]) => {
    const file = files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUri = e.target?.result as string;
      const base64Part = dataUri.split(',')[1] || '';
      setFileData({
        name: file.name,
        size: file.size,
        mime: file.type || 'application/octet-stream',
        base64: base64Part,
        dataUri,
      });
      success(`Archivo "${file.name}" convertido a Base64`);
    };
    reader.onerror = () => {
      toastError('Error al leer el archivo');
    };
    reader.readAsDataURL(file);
  };

  // Download decoded Base64 as file
  const handleDownloadDecodedFile = () => {
    let clean = decodedInput.trim();
    if (!clean) return;

    let mimeType = downloadMime;
    const match = clean.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (match) {
      mimeType = match[1];
      clean = match[2];
    }

    try {
      clean = clean.replace(/-/g, '+').replace(/_/g, '/');
      while (clean.length % 4 !== 0) {
        clean += '=';
      }
      const byteCharacters = atob(clean);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadFileName || 'archivo-descargado';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      success('Archivo descargado con éxito');
    } catch {
      toastError('No se pudo convertir este Base64 a archivo binario');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Binary className="w-5 h-5 text-[var(--accent-text)]" />
            Codificador y Decodificador Base64
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Compatibilidad UTF-8 completa (tildes, ñ, emojis), URL-safe y conversión de archivos.
          </p>
        </div>

        <Tabs
          tabs={[
            { id: 'encode', label: 'Codificar Texto' },
            { id: 'decode', label: 'Decodificar Texto' },
            { id: 'file', label: 'Archivo ↔ Base64' },
          ]}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as any)}
        />
      </div>

      {/* Tab: Encode */}
      {activeTab === 'encode' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={urlSafe}
                onChange={(e) => setUrlSafe(e.target.checked)}
                className="rounded accent-[var(--accent-color)]"
              />
              <span>Modo URL-safe (reemplaza + / por - _ y quita =)</span>
            </label>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="flex flex-col p-4 sm:p-5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Texto en Claro (UTF-8)
              </span>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribe aquí el texto que deseas codificar..."
                className="w-full h-64 sm:h-80 p-3.5 rounded-xl resize-none bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
              />
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-400">{inputText.length} caracteres</span>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                  onClick={() => setInputText('')}
                  disabled={!inputText}
                >
                  Limpiar
                </Button>
              </div>
            </Card>

            <Card className="flex flex-col p-4 sm:p-5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Resultado en Base64
              </span>
              <textarea
                readOnly
                value={encodedResult}
                placeholder="El código Base64 aparecerá aquí..."
                className="w-full h-64 sm:h-80 p-3.5 rounded-xl resize-none bg-slate-50/40 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none"
              />
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-400">{encodedResult.length} caracteres</span>
                <CopyButton text={encodedResult} size="sm" variant="primary" label="Copiar Base64" />
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tab: Decode */}
      {activeTab === 'decode' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="flex flex-col p-4 sm:p-5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Cadena Base64
              </span>
              <textarea
                value={decodedInput}
                onChange={(e) => setDecodedInput(e.target.value)}
                placeholder="Pega aquí la cadena en Base64 o Data URI..."
                className="w-full h-64 sm:h-80 p-3.5 rounded-xl resize-none bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
              />
              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-400">{decodedInput.length} caracteres</span>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                  onClick={() => setDecodedInput('')}
                  disabled={!decodedInput}
                >
                  Limpiar
                </Button>
              </div>
            </Card>

            <Card className="flex flex-col p-4 sm:p-5 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Texto Decodificado
              </span>

              {decodedResult.error ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-xl">
                  <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
                  <p className="text-sm font-bold text-rose-700 dark:text-rose-300">
                    Base64 inválido
                  </p>
                  <p className="text-xs text-rose-600 dark:text-rose-400 mt-1 max-w-xs">
                    {decodedResult.error}
                  </p>
                </div>
              ) : (
                <textarea
                  readOnly
                  value={decodedResult.text}
                  placeholder="El texto decodificado aparecerá aquí..."
                  className="w-full h-64 sm:h-80 p-3.5 rounded-xl resize-none bg-slate-50/40 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none"
                />
              )}

              <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-400">{decodedResult.text.length} caracteres</span>
                <CopyButton
                  text={decodedResult.text}
                  size="sm"
                  variant="primary"
                  label="Copiar texto"
                  showToast
                />
              </div>
            </Card>
          </div>

          {/* Download binary file section */}
          {decodedInput && !decodedResult.error && (
            <Card className="p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[var(--accent-text)]">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      ¿Es un archivo binario (imagen, PDF, audio)?
                    </h4>
                    <p className="text-xs text-slate-500">
                      Descárgalo directamente al disco local en su formato original.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={downloadFileName}
                    onChange={(e) => setDownloadFileName(e.target.value)}
                    placeholder="nombre-archivo.ext"
                    className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 w-44"
                  />
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<Download className="w-3.5 h-3.5" />}
                    onClick={handleDownloadDecodedFile}
                  >
                    Descargar archivo
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Tab: File to Base64 */}
      {activeTab === 'file' && (
        <div className="space-y-6">
          <Dropzone
            onFilesSelected={handleFile}
            label="Arrastra cualquier archivo aquí para convertirlo a Base64"
            helperText="Imágenes (PNG, JPG, SVG, WebP), PDF, documentos o audios"
          />

          {fileData && (
            <Card className="p-5 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[var(--accent-subtle)] text-[var(--accent-text)]">
                    <FileCode className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {fileData.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Tipo: {fileData.mime} • Tamaño: {(fileData.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <CopyButton text={fileData.base64} label="Copiar Base64" size="sm" />
                  <CopyButton text={fileData.dataUri} label="Copiar Data URI" size="sm" variant="primary" />
                </div>
              </div>

              {/* Image Preview if applicable */}
              {fileData.mime.startsWith('image/') && (
                <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <span className="text-xs font-semibold text-slate-400 mb-2">Vista previa</span>
                  <img
                    src={fileData.dataUri}
                    alt={fileData.name}
                    className="max-h-60 max-w-full rounded-xl object-contain shadow-xs"
                  />
                </div>
              )}

              {/* Data URI snippet */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase">
                  Data URI completo (listo para &lt;img src=&quot;...&quot;&gt; o CSS)
                </span>
                <textarea
                  readOnly
                  value={fileData.dataUri}
                  rows={4}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-700 dark:text-slate-300 resize-none focus:outline-none"
                />
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
