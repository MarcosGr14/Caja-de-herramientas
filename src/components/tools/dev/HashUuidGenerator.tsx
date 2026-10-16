import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ShieldCheck,
  Fingerprint,
  Hash,
  Copy,
  CheckCircle2,
  XCircle,
  FileCode,
  RotateCw,
  Sliders,
  Trash2,
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Tabs } from '../../ui/Tabs';
import { Button } from '../../ui/Button';
import { CopyButton } from '../../ui/CopyButton';
import { Dropzone } from '../../ui/Dropzone';
import { useToast } from '../../ui/Toast';

// Calculate hash using Web Crypto API
async function computeHash(algorithm: string, data: BufferSource): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(algorithm, data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export default function HashUuidGenerator() {
  const [activeTab, setActiveTab] = useState<'hash' | 'uuid'>('hash');
  
  // Hash tab state
  const [hashSourceType, setHashSourceType] = useState<'text' | 'file'>('text');
  const [inputText, setInputText] = useState('Texto seguro para calcular hashes con Web Crypto API');
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null);
  const [fileBuffer, setFileBuffer] = useState<ArrayBuffer | null>(null);
  const [uppercaseHashes, setUppercaseHashes] = useState(false);
  const [compareHash, setCompareHash] = useState('');

  const [hashes, setHashes] = useState<{
    'SHA-1': string;
    'SHA-256': string;
    'SHA-384': string;
    'SHA-512': string;
  }>({
    'SHA-1': '',
    'SHA-256': '',
    'SHA-384': '',
    'SHA-512': '',
  });

  // UUID tab state
  const [uuidCount, setUuidCount] = useState(5);
  const [uuids, setUuids] = useState<string[]>([]);
  const [uuidUppercase, setUuidUppercase] = useState(false);

  const { success, error: toastError } = useToast();

  // Compute all 4 hashes whenever input changes
  const runHashCalculation = useCallback(async () => {
    try {
      let data: BufferSource;
      if (hashSourceType === 'text') {
        const encoder = new TextEncoder();
        data = encoder.encode(inputText);
      } else {
        if (!fileBuffer) {
          setHashes({ 'SHA-1': '', 'SHA-256': '', 'SHA-384': '', 'SHA-512': '' });
          return;
        }
        data = fileBuffer;
      }

      const [sha1, sha256, sha384, sha512] = await Promise.all([
        computeHash('SHA-1', data),
        computeHash('SHA-256', data),
        computeHash('SHA-384', data),
        computeHash('SHA-512', data),
      ]);

      setHashes({
        'SHA-1': sha1,
        'SHA-256': sha256,
        'SHA-384': sha384,
        'SHA-512': sha512,
      });
    } catch (err) {
      console.error('Error calculando hashes:', err);
    }
  }, [hashSourceType, inputText, fileBuffer]);

  useEffect(() => {
    runHashCalculation();
  }, [runHashCalculation]);

  // Handle file selection for hash
  const handleFileForHash = async (files: File[]) => {
    const file = files[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      setFileInfo({ name: file.name, size: file.size });
      setFileBuffer(buffer);
      setHashSourceType('file');
      success(`Archivo "${file.name}" cargado`);
    } catch {
      toastError('No se pudo leer el archivo seleccionado');
    }
  };

  // Generate UUIDs with crypto.randomUUID or crypto.getRandomValues
  const generateUuids = useCallback(() => {
    const newUuids: string[] = [];
    for (let i = 0; i < uuidCount; i++) {
      if (typeof crypto.randomUUID === 'function') {
        newUuids.push(crypto.randomUUID());
      } else {
        // Fallback using crypto.getRandomValues
        const rnd = new Uint8Array(16);
        crypto.getRandomValues(rnd);
        rnd[6] = (rnd[6] & 0x0f) | 0x40; // version 4
        rnd[8] = (rnd[8] & 0x3f) | 0x80; // variant
        const hex = Array.from(rnd, (b) => b.toString(16).padStart(2, '0')).join('');
        newUuids.push(
          `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
        );
      }
    }
    setUuids(newUuids);
  }, [uuidCount]);

  useEffect(() => {
    generateUuids();
  }, [generateUuids]);

  // Hash comparator evaluation
  const comparisonResult = useMemo(() => {
    const cleanCompare = compareHash.trim().toLowerCase();
    if (!cleanCompare) return null;

    const algorithms: (keyof typeof hashes)[] = ['SHA-256', 'SHA-512', 'SHA-1', 'SHA-384'];
    for (const algo of algorithms) {
      if (hashes[algo] && hashes[algo].toLowerCase() === cleanCompare) {
        return { match: true, algorithm: algo };
      }
    }
    return { match: false, algorithm: null };
  }, [compareHash, hashes]);

  const allUuidsString = useMemo(() => {
    const list = uuidUppercase ? uuids.map((u) => u.toUpperCase()) : uuids;
    return list.join('\n');
  }, [uuids, uuidUppercase]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Hash className="w-5 h-5 text-[var(--accent-text)]" />
            Generador de Hashes Criptográficos y UUID
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cálculo instantáneo con Web Crypto API (SHA-1, 256, 384, 512) y UUID v4 aleatorios seguros.
          </p>
        </div>

        <Tabs
          tabs={[
            { id: 'hash', label: 'Cálculo de Hashes', icon: <Hash className="w-4 h-4" /> },
            { id: 'uuid', label: 'Generador de UUID v4', icon: <Fingerprint className="w-4 h-4" /> },
          ]}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as any)}
        />
      </div>

      {/* Tab: HASH */}
      {activeTab === 'hash' && (
        <div className="space-y-6">
          {/* Source Selector & Options */}
          <Card className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant={hashSourceType === 'text' ? 'primary' : 'outline'}
                  onClick={() => setHashSourceType('text')}
                >
                  Texto
                </Button>
                <Button
                  size="sm"
                  variant={hashSourceType === 'file' ? 'primary' : 'outline'}
                  onClick={() => setHashSourceType('file')}
                >
                  Archivo
                </Button>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={uppercaseHashes}
                  onChange={(e) => setUppercaseHashes(e.target.checked)}
                  className="rounded accent-[var(--accent-color)]"
                />
                <span>Mostrar hashes en MAYÚSCULAS</span>
              </label>
            </div>

            <div className="pt-4">
              {hashSourceType === 'text' ? (
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Escribe el texto que deseas hashear..."
                  rows={3}
                  className="w-full p-3.5 rounded-xl resize-none bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
                />
              ) : (
                <div className="space-y-3">
                  <Dropzone
                    onFilesSelected={handleFileForHash}
                    label="Arrastra cualquier archivo para calcular su checksum"
                    helperText="Cualquier tamaño (calculado localmente en memoria)"
                  />
                  {fileInfo && (
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                      <div className="flex items-center gap-2">
                        <FileCode className="w-4 h-4 text-[var(--accent-text)]" />
                        <span className="font-bold text-slate-800 dark:text-slate-200">{fileInfo.name}</span>
                        <span className="text-slate-400">({(fileInfo.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setFileInfo(null);
                          setFileBuffer(null);
                        }}
                      >
                        Quitar
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </Card>

          {/* Results: 4 Hashes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(['SHA-256', 'SHA-512', 'SHA-1', 'SHA-384'] as const).map((algo) => {
              const raw = hashes[algo];
              const display = uppercaseHashes ? raw.toUpperCase() : raw;

              return (
                <Card key={algo} className="p-4 flex flex-col justify-between space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-text)]">
                      {algo}
                    </span>
                    <CopyButton text={display} size="sm" label="Copiar" />
                  </div>
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200/60 dark:border-slate-800/80">
                    <p className="font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all">
                      {display || 'Calculando...'}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Hash Comparator */}
          <Card className="p-4 sm:p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[var(--accent-text)]" />
              Comparador y Verificador de Checksum
            </h3>
            <p className="text-xs text-slate-500">
              Pega un hash esperado (por ejemplo, el facilitado por el creador del archivo) para verificar su integridad.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={compareHash}
                onChange={(e) => setCompareHash(e.target.value)}
                placeholder="Pega aquí el hash esperado a comparar..."
                className="flex-1 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[var(--accent-ring)]"
              />
              {compareHash && (
                <Button size="sm" variant="ghost" onClick={() => setCompareHash('')}>
                  Limpiar
                </Button>
              )}
            </div>

            {comparisonResult && (
              <div
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-semibold ${
                  comparisonResult.match
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                    : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                }`}
              >
                {comparisonResult.match ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span>
                      ¡Coincidencia exacta! El hash corresponde a <strong>{comparisonResult.algorithm}</strong>. La integridad está confirmada.
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    <span>
                      El hash no coincide con ninguno de los calculados (SHA-1, SHA-256, SHA-384, SHA-512).
                    </span>
                  </>
                )}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Tab: UUID */}
      {activeTab === 'uuid' && (
        <div className="space-y-6">
          <Card className="p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Cantidad a generar: {uuidCount}
                </span>
                <input
                  type="range"
                  min="1"
                  max="50"
                  value={uuidCount}
                  onChange={(e) => setUuidCount(Number(e.target.value))}
                  className="w-36 accent-[var(--accent-color)]"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={uuidUppercase}
                    onChange={(e) => setUuidUppercase(e.target.checked)}
                    className="rounded accent-[var(--accent-color)]"
                  />
                  <span>Mayúsculas</span>
                </label>

                <Button
                  size="sm"
                  variant="primary"
                  icon={<RotateCw className="w-3.5 h-3.5" />}
                  onClick={generateUuids}
                >
                  Regenerar
                </Button>

                <CopyButton text={allUuidsString} size="sm" label="Copiar todos" />
              </div>
            </div>
          </Card>

          {/* List of generated UUIDs */}
          <div className="space-y-2">
            {uuids.map((uuid, idx) => {
              const display = uuidUppercase ? uuid.toUpperCase() : uuid;
              return (
                <div
                  key={`${uuid}-${idx}`}
                  className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-bold text-slate-400 w-6 text-right">
                      {idx + 1}.
                    </span>
                    <span className="font-mono text-xs sm:text-sm text-slate-800 dark:text-slate-200 truncate select-all">
                      {display}
                    </span>
                  </div>
                  <CopyButton text={display} size="sm" variant="ghost" label="" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
