import React, { useState, useMemo } from 'react';
import {
  Network,
  Download,
  Copy,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Layers,
  Table,
  Sliders,
} from 'lucide-react';
import { Card } from '../../ui/Card';
import { Tabs } from '../../ui/Tabs';
import { Button } from '../../ui/Button';
import { CopyButton } from '../../ui/CopyButton';
import { useLocalStorage } from '../../../hooks/useLocalStorage';
import { useToast } from '../../ui/Toast';
import {
  isValidIPv4,
  maskToCidr,
  cidrToInt,
  intToIPv4,
  analyzeSubnet,
  divideIntoEqualSubnets,
  computeVLSM,
  exportSubnetsToCsv,
  VLSMRequirement,
} from '../../../utils/ipv4Utils';

const DEFAULT_VLSM_REQS: VLSMRequirement[] = [
  { id: '1', name: 'Departamento de Desarrollo', neededHosts: 60 },
  { id: '2', name: 'Administración y Finanzas', neededHosts: 28 },
  { id: '3', name: 'Servidores Locales', neededHosts: 12 },
  { id: '4', name: 'Enlace Punto a Punto (WAN)', neededHosts: 2 },
];

export default function SubnetCalculator() {
  const [activeTab, setActiveTab] = useLocalStorage<'analysis' | 'equal' | 'vlsm'>(
    'app-subnet-tab',
    'analysis'
  );

  const [ipInput, setIpInput] = useState('192.168.1.100');
  const [cidrInput, setCidrInput] = useState(24);
  const [maskInput, setMaskInput] = useState('255.255.255.0');
  const [maskMode, setMaskMode] = useState<'cidr' | 'decimal'>('cidr');

  // Equal division
  const [equalCount, setEqualCount] = useState<number>(4);

  // VLSM requirements
  const [vlsmReqs, setVlsmReqs] = useLocalStorage<VLSMRequirement[]>(
    'app-subnet-vlsm-reqs',
    DEFAULT_VLSM_REQS
  );

  const { success, error: toastError } = useToast();

  // Keep CIDR and decimal mask synced
  const handleCidrChange = (c: number) => {
    setCidrInput(c);
    setMaskInput(intToIPv4(cidrToInt(c)));
  };

  const handleMaskChange = (mStr: string) => {
    setMaskInput(mStr);
    const calculated = maskToCidr(mStr);
    if (calculated !== null) {
      setCidrInput(calculated);
    }
  };

  // Main network analysis
  const analysis = useMemo(() => {
    return analyzeSubnet(ipInput, cidrInput);
  }, [ipInput, cidrInput]);

  // Equal subnets list
  const equalSubnets = useMemo(() => {
    if (!analysis) return [];
    return divideIntoEqualSubnets(analysis.network, cidrInput, equalCount);
  }, [analysis, cidrInput, equalCount]);

  // VLSM calculation
  const vlsmResult = useMemo(() => {
    if (!analysis) return { subnets: [], error: null };
    return computeVLSM(analysis.network, cidrInput, vlsmReqs);
  }, [analysis, cidrInput, vlsmReqs]);

  // Export CSV
  const handleExportCsv = (rows: any[], filename = 'subredes.csv') => {
    const csv = exportSubnetsToCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    success('Archivo CSV descargado con éxito');
  };

  // Add VLSM requirement
  const handleAddVlsm = () => {
    const newReq: VLSMRequirement = {
      id: Math.random().toString(36).substring(2, 9),
      name: `Subred #${vlsmReqs.length + 1}`,
      neededHosts: 10,
    };
    setVlsmReqs((prev) => [...prev, newReq]);
  };

  const handleRemoveVlsm = (id: string) => {
    setVlsmReqs((prev) => prev.filter((r) => r.id !== id));
  };

  const handleUpdateVlsm = (id: string, field: 'name' | 'neededHosts', val: any) => {
    setVlsmReqs((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  // Binary Representation formatting: network bits colored vs host bits
  const binaryColored = useMemo(() => {
    if (!analysis) return null;
    const rawBits = analysis.ipBinary.replace(/\./g, '');
    const netPart = rawBits.slice(0, cidrInput);
    const hostPart = rawBits.slice(cidrInput);

    return {
      netPart,
      hostPart,
    };
  }, [analysis, cidrInput]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Network className="w-5 h-5 text-[var(--accent-text)]" />
            Calculadora de Subredes IPv4 y VLSM
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cálculo de rangos, máscaras, hosts útiles, división en partes iguales y diseño VLSM.
          </p>
        </div>

        <Tabs
          tabs={[
            { id: 'analysis', label: 'Análisis de Red' },
            { id: 'equal', label: 'Dividir en Partes Iguales' },
            { id: 'vlsm', label: 'Diseño VLSM' },
          ]}
          activeTab={activeTab}
          onChange={(tab) => setActiveTab(tab as any)}
        />
      </div>

      {/* Main IP & Mask Input Card */}
      <Card className="p-4 sm:p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          <div className="sm:col-span-6">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Dirección IP (IPv4)
            </label>
            <input
              type="text"
              value={ipInput}
              onChange={(e) => setIpInput(e.target.value)}
              placeholder="192.168.1.1"
              className={`w-full p-2.5 rounded-xl border bg-white dark:bg-slate-950 font-mono text-sm font-bold ${
                isValidIPv4(ipInput)
                  ? 'border-slate-200 dark:border-slate-700'
                  : 'border-rose-400 dark:border-rose-700 text-rose-500'
              }`}
            />
          </div>

          <div className="sm:col-span-6 space-y-1">
            <div className="flex justify-between items-center text-xs">
              <label className="font-bold text-slate-700 dark:text-slate-300">
                Máscara de Subred: <strong className="text-[var(--accent-text)]">/{cidrInput}</strong>
              </label>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setMaskMode('cidr')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    maskMode === 'cidr' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-400'
                  }`}
                >
                  CIDR
                </button>
                <button
                  onClick={() => setMaskMode('decimal')}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    maskMode === 'decimal' ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900' : 'text-slate-400'
                  }`}
                >
                  Decimal
                </button>
              </div>
            </div>

            {maskMode === 'cidr' ? (
              <select
                value={cidrInput}
                onChange={(e) => handleCidrChange(Number(e.target.value))}
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono font-bold"
              >
                {Array.from({ length: 33 }, (_, i) => i).map((c) => (
                  <option key={c} value={c}>
                    /{c} — {intToIPv4(cidrToInt(c))} ({Math.pow(2, 32 - c).toLocaleString('es')} IPs)
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={maskInput}
                onChange={(e) => handleMaskChange(e.target.value)}
                placeholder="255.255.255.0"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono font-bold"
              />
            )}
          </div>
        </div>

        {/* Quick CIDR Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-400 text-[11px] font-bold">Máscaras frecuentes:</span>
          {[8, 16, 24, 25, 26, 27, 28, 29, 30, 31, 32].map((c) => (
            <button
              key={c}
              onClick={() => handleCidrChange(c)}
              className={`px-2 py-1 rounded-lg font-mono font-bold transition text-xs ${
                cidrInput === c
                  ? 'bg-[var(--accent-color)] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              /{c}
            </button>
          ))}
        </div>
      </Card>

      {/* ---------------- TAB 1: ANÁLISIS DE RED ---------------- */}
      {activeTab === 'analysis' && analysis && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-3.5">
              <span className="text-xs text-slate-400 font-bold">Dirección de Red</span>
              <p className="font-mono text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 mt-1">
                {analysis.network}
              </p>
              <span className="text-[10px] text-slate-400">/{analysis.cidr}</span>
            </Card>

            <Card className="p-3.5">
              <span className="text-xs text-slate-400 font-bold">Broadcast</span>
              <p className="font-mono text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 mt-1">
                {analysis.broadcast}
              </p>
              <span className="text-[10px] text-slate-400">Última IP del bloque</span>
            </Card>

            <Card className="p-3.5">
              <span className="text-xs text-slate-400 font-bold">Hosts Utilizables</span>
              <p className="font-mono text-sm sm:text-base font-black text-[var(--accent-text)] mt-1">
                {analysis.usableHosts.toLocaleString('es')}
              </p>
              <span className="text-[10px] text-slate-400">Total bloque: {analysis.totalHosts.toLocaleString('es')}</span>
            </Card>

            <Card className="p-3.5">
              <span className="text-xs text-slate-400 font-bold">Clase y Tipo</span>
              <p className="font-mono text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 mt-1">
                Clase {analysis.ipClass}
              </p>
              <span className="text-[10px] text-slate-400">{analysis.ipType}</span>
            </Card>
          </div>

          {/* Details Table */}
          <Card className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Detalles Completos de la Subred
              </span>
              <CopyButton
                text={`Red: ${analysis.network}/${analysis.cidr}\nMáscara: ${analysis.mask}\nPrimer Host: ${analysis.firstHost}\nÚltimo Host: ${analysis.lastHost}\nBroadcast: ${analysis.broadcast}\nHosts Útiles: ${analysis.usableHosts}`}
                size="sm"
                label="Copiar resumen"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="text-slate-500 font-sans">Primer host asignable:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{analysis.firstHost}</span>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="text-slate-500 font-sans">Último host asignable:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{analysis.lastHost}</span>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="text-slate-500 font-sans">Máscara Wildcard (Inversa):</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{analysis.wildcard}</span>
              </div>

              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <span className="text-slate-500 font-sans">Rango completo:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {analysis.firstHost} - {analysis.lastHost}
                </span>
              </div>
            </div>

            {/* Special RFC Cases Notice */}
            {analysis.cidr === 31 && (
              <div className="flex items-center gap-2 p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-300 dark:border-sky-800 rounded-xl text-sky-800 dark:text-sky-200 text-xs">
                <CheckCircle2 className="w-4 h-4 text-sky-500 shrink-0" />
                <span>
                  <strong>RFC 3021 (Enlaces Punto a Punto):</strong> En subredes /31, las dos direcciones disponibles se usan como hosts sin reservar red ni broadcast.
                </span>
              </div>
            )}

            {analysis.cidr === 32 && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-amber-800 dark:text-amber-200 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  <strong>Subred /32:</strong> Identifica un host único específico (ruta de host / loopback).
                </span>
              </div>
            )}

            {/* Binary Representation with Network vs Host Colors */}
            <div className="p-4 bg-slate-900 text-white rounded-2xl font-mono text-xs space-y-2 pt-3">
              <div className="flex items-center justify-between text-[11px] pb-1 border-b border-slate-800">
                <span className="text-slate-400">Representación Binaria (Red vs Host)</span>
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-sky-400">
                    <span className="w-2.5 h-2.5 rounded bg-sky-500" /> Bits de Red ({cidrInput})
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Bits de Host ({32 - cidrInput})
                  </span>
                </div>
              </div>

              {binaryColored && (
                <div className="text-sm tracking-widest break-all py-1">
                  <span className="text-sky-400 font-bold">{binaryColored.netPart}</span>
                  <span className="text-emerald-400 font-bold">{binaryColored.hostPart}</span>
                </div>
              )}

              <div className="text-[11px] text-slate-400 pt-1">
                Máscara binaria: <span className="text-slate-200">{analysis.maskBinary}</span>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ---------------- TAB 2: DIVIDIR EN PARTES IGUALES ---------------- */}
      {activeTab === 'equal' && analysis && (
        <div className="space-y-4">
          <Card className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-500">Cantidad de subredes iguales:</span>
                {[2, 4, 8, 16, 32].map((cnt) => (
                  <button
                    key={cnt}
                    onClick={() => setEqualCount(cnt)}
                    className={`px-3 py-1 rounded-xl font-bold transition ${
                      equalCount === cnt
                        ? 'bg-[var(--accent-color)] text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>

              <Button
                size="sm"
                variant="outline"
                icon={<Download className="w-3.5 h-3.5" />}
                onClick={() => handleExportCsv(equalSubnets, `subredes-${analysis.network}.csv`)}
              >
                Exportar CSV
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold">
                    <th className="pb-2">Subred</th>
                    <th className="pb-2">Red</th>
                    <th className="pb-2">Máscara</th>
                    <th className="pb-2">Rango Asignable</th>
                    <th className="pb-2">Broadcast</th>
                    <th className="pb-2 text-right">Hosts Útiles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {equalSubnets.map((sub) => (
                    <tr key={sub.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 font-bold font-sans text-slate-700 dark:text-slate-300">{sub.name}</td>
                      <td className="py-2.5 font-bold text-[var(--accent-text)]">{sub.network}/{sub.cidr}</td>
                      <td className="py-2.5 text-slate-500">{sub.mask}</td>
                      <td className="py-2.5 text-slate-700 dark:text-slate-300">{sub.range}</td>
                      <td className="py-2.5 text-slate-500">{sub.broadcast}</td>
                      <td className="py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {sub.usableHosts}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ---------------- TAB 3: DISEÑO VLSM ---------------- */}
      {activeTab === 'vlsm' && analysis && (
        <div className="space-y-4">
          <Card className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Subneteo de Longitud Variable (VLSM)
                </h3>
                <p className="text-xs text-slate-500">
                  Red base: <strong>{analysis.network}/{analysis.cidr}</strong> ({analysis.totalHosts} IPs disponibles).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" icon={<Plus className="w-3.5 h-3.5" />} onClick={handleAddVlsm}>
                  Añadir subred
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  icon={<Download className="w-3.5 h-3.5" />}
                  onClick={() => handleExportCsv(vlsmResult.subnets, `vlsm-${analysis.network}.csv`)}
                  disabled={vlsmResult.subnets.length === 0}
                >
                  Exportar CSV
                </Button>
              </div>
            </div>

            {/* Requirements Editor */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Requerimientos por Subred (ordenados automáticamente de mayor a menor)
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {vlsmReqs.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <input
                      type="text"
                      value={req.name}
                      onChange={(e) => handleUpdateVlsm(req.id, 'name', e.target.value)}
                      placeholder="Nombre de la subred"
                      className="flex-1 p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 font-medium"
                    />
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        max="1000000"
                        value={req.neededHosts}
                        onChange={(e) => handleUpdateVlsm(req.id, 'neededHosts', Math.max(1, Number(e.target.value) || 1))}
                        className="w-16 p-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 text-center font-bold"
                      />
                      <span className="text-slate-400 font-sans">hosts</span>
                    </div>
                    <button
                      onClick={() => handleRemoveVlsm(req.id)}
                      className="p-1 text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Error banner if space exhausted */}
            {vlsmResult.error && (
              <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 text-xs">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{vlsmResult.error}</span>
              </div>
            )}

            {/* VLSM Results Table */}
            <div className="overflow-x-auto pt-2">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold">
                    <th className="pb-2">Nombre</th>
                    <th className="pb-2">Red Asignada</th>
                    <th className="pb-2">Máscara</th>
                    <th className="pb-2">Rango Asignable</th>
                    <th className="pb-2">Broadcast</th>
                    <th className="pb-2 text-right">Hosts Útiles</th>
                    <th className="pb-2 text-right">Bloque</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {vlsmResult.subnets.map((sub) => (
                    <tr key={sub.name} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 font-bold font-sans text-slate-700 dark:text-slate-300">{sub.name}</td>
                      <td className="py-2.5 font-bold text-[var(--accent-text)]">{sub.network}/{sub.cidr}</td>
                      <td className="py-2.5 text-slate-500">{sub.mask}</td>
                      <td className="py-2.5 text-slate-700 dark:text-slate-300">{sub.range}</td>
                      <td className="py-2.5 text-slate-500">{sub.broadcast}</td>
                      <td className="py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {sub.usableHosts}
                      </td>
                      <td className="py-2.5 text-right text-slate-400">{sub.allocatedHosts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
