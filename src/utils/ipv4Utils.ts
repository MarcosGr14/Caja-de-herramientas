// Pure logic utility for IPv4 Subnetting, VLSM, and Network Analysis

export interface IPv4Analysis {
  ip: string;
  cidr: number;
  mask: string;
  wildcard: string;
  network: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  totalHosts: number;
  usableHosts: number;
  ipClass: 'A' | 'B' | 'C' | 'D' | 'E';
  ipType: 'Privada' | 'Pública' | 'Loopback' | 'Link-Local' | 'Multicast' | 'Reservada';
  ipBinary: string;
  maskBinary: string;
  networkBinary: string;
  broadcastBinary: string;
}

export interface SubnetRow {
  name: string;
  network: string;
  cidr: number;
  mask: string;
  range: string;
  broadcast: string;
  usableHosts: number;
  allocatedHosts: number;
}

/**
 * Validate IPv4 address string (e.g. 192.168.1.1)
 */
export function isValidIPv4(ip: string): boolean {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return false;
  return parts.every((p) => {
    if (!/^\d+$/.test(p)) return false;
    const n = Number(p);
    return n >= 0 && n <= 255;
  });
}

/**
 * Convert 32-bit unsigned number to dotted-quad string
 */
export function intToIPv4(intVal: number): string {
  return [
    (intVal >>> 24) & 255,
    (intVal >>> 16) & 255,
    (intVal >>> 8) & 255,
    intVal & 255,
  ].join('.');
}

/**
 * Convert dotted-quad string to 32-bit unsigned number
 */
export function ipv4ToInt(ip: string): number {
  const parts = ip.trim().split('.').map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

/**
 * Convert 32-bit int to 32-character binary string with dot grouping
 */
export function intToBinaryOctets(intVal: number): string {
  const raw = (intVal >>> 0).toString(2).padStart(32, '0');
  return `${raw.slice(0, 8)}.${raw.slice(8, 16)}.${raw.slice(16, 24)}.${raw.slice(24, 32)}`;
}

/**
 * Convert CIDR (0..32) to subnet mask 32-bit int
 */
export function cidrToInt(cidr: number): number {
  if (cidr === 0) return 0;
  return (0xffffffff << (32 - cidr)) >>> 0;
}

/**
 * Convert dotted-quad subnet mask to CIDR number
 */
export function maskToCidr(maskStr: string): number | null {
  if (!isValidIPv4(maskStr)) return null;
  const intVal = ipv4ToInt(maskStr);
  let count = 0;
  let seenZero = false;
  for (let i = 31; i >= 0; i--) {
    const bit = (intVal >>> i) & 1;
    if (bit === 1) {
      if (seenZero) return null; // non-contiguous mask
      count++;
    } else {
      seenZero = true;
    }
  }
  return count;
}

/**
 * Determine IPv4 Class
 */
export function getIPv4Class(firstOctet: number): 'A' | 'B' | 'C' | 'D' | 'E' {
  if (firstOctet <= 127) return 'A';
  if (firstOctet <= 191) return 'B';
  if (firstOctet <= 223) return 'C';
  if (firstOctet <= 239) return 'D';
  return 'E';
}

/**
 * Determine IPv4 scope/type
 */
export function getIPv4Type(ipInt: number): 'Privada' | 'Pública' | 'Loopback' | 'Link-Local' | 'Multicast' | 'Reservada' {
  const o1 = (ipInt >>> 24) & 255;
  const o2 = (ipInt >>> 16) & 255;

  if (o1 === 127) return 'Loopback';
  if (o1 === 10) return 'Privada';
  if (o1 === 172 && o2 >= 16 && o2 <= 31) return 'Privada';
  if (o1 === 192 && o2 === 168) return 'Privada';
  if (o1 === 169 && o2 === 254) return 'Link-Local';
  if (o1 >= 224 && o1 <= 239) return 'Multicast';
  if (o1 >= 240) return 'Reservada';
  return 'Pública';
}

/**
 * Comprehensive IPv4 and Subnet Calculator
 */
export function analyzeSubnet(ipStr: string, cidr: number): IPv4Analysis | null {
  if (!isValidIPv4(ipStr) || cidr < 0 || cidr > 32) return null;

  const ipInt = ipv4ToInt(ipStr);
  const maskInt = cidrToInt(cidr);
  const wildcardInt = ~maskInt >>> 0;
  const networkInt = (ipInt & maskInt) >>> 0;
  const broadcastInt = (networkInt | wildcardInt) >>> 0;

  const totalHosts = Math.pow(2, 32 - cidr);
  let usableHosts = 0;
  let firstHostInt = 0;
  let lastHostInt = 0;

  if (cidr === 32) {
    usableHosts = 1;
    firstHostInt = networkInt;
    lastHostInt = networkInt;
  } else if (cidr === 31) {
    // RFC 3021 Point-to-Point
    usableHosts = 2;
    firstHostInt = networkInt;
    lastHostInt = broadcastInt;
  } else {
    usableHosts = Math.max(0, totalHosts - 2);
    firstHostInt = (networkInt + 1) >>> 0;
    lastHostInt = (broadcastInt - 1) >>> 0;
  }

  const o1 = (ipInt >>> 24) & 255;

  return {
    ip: ipStr.trim(),
    cidr,
    mask: intToIPv4(maskInt),
    wildcard: intToIPv4(wildcardInt),
    network: intToIPv4(networkInt),
    broadcast: intToIPv4(broadcastInt),
    firstHost: intToIPv4(firstHostInt),
    lastHost: intToIPv4(lastHostInt),
    totalHosts,
    usableHosts,
    ipClass: getIPv4Class(o1),
    ipType: getIPv4Type(ipInt),
    ipBinary: intToBinaryOctets(ipInt),
    maskBinary: intToBinaryOctets(maskInt),
    networkBinary: intToBinaryOctets(networkInt),
    broadcastBinary: intToBinaryOctets(broadcastInt),
  };
}

/**
 * Divide network into equal subnets (count: 2, 4, 8, 16, etc.)
 */
export function divideIntoEqualSubnets(networkIp: string, baseCidr: number, subnetCount: number): SubnetRow[] {
  const base = analyzeSubnet(networkIp, baseCidr);
  if (!base) return [];

  const additionalBits = Math.ceil(Math.log2(subnetCount));
  const newCidr = baseCidr + additionalBits;
  if (newCidr > 32) return [];

  const actualSubnets = Math.pow(2, additionalBits);
  const networkSize = Math.pow(2, 32 - newCidr);
  const baseNetInt = ipv4ToInt(base.network);
  const rows: SubnetRow[] = [];

  for (let i = 0; i < actualSubnets; i++) {
    const netInt = (baseNetInt + i * networkSize) >>> 0;
    const sub = analyzeSubnet(intToIPv4(netInt), newCidr);
    if (!sub) break;
    rows.push({
      name: `Subred #${i + 1}`,
      network: sub.network,
      cidr: newCidr,
      mask: sub.mask,
      range: `${sub.firstHost} - ${sub.lastHost}`,
      broadcast: sub.broadcast,
      usableHosts: sub.usableHosts,
      allocatedHosts: sub.totalHosts,
    });
  }
  return rows;
}

/**
 * VLSM Subnetting calculation (Variable Length Subnet Masking)
 */
export interface VLSMRequirement {
  id: string;
  name: string;
  neededHosts: number;
}

export function computeVLSM(
  baseNetwork: string,
  baseCidr: number,
  requirements: VLSMRequirement[]
): { subnets: SubnetRow[]; error: string | null } {
  const base = analyzeSubnet(baseNetwork, baseCidr);
  if (!base) return { subnets: [], error: 'Dirección de red base inválida.' };

  // Sort requirements descending by required hosts
  const sortedReqs = [...requirements]
    .filter((r) => r.neededHosts > 0)
    .sort((a, b) => b.neededHosts - a.neededHosts);

  if (sortedReqs.length === 0) {
    return { subnets: [], error: 'Ingresa al menos un requerimiento con más de 0 hosts.' };
  }

  const baseNetInt = ipv4ToInt(base.network);
  const maxAvailableHosts = base.totalHosts;
  let currentNetInt = baseNetInt;
  let totalAllocated = 0;
  const result: SubnetRow[] = [];

  for (const req of sortedReqs) {
    // Determine smallest CIDR that satisfies needed hosts + 2 (for net and bcast)
    let neededTotal = req.neededHosts + 2;
    if (req.neededHosts === 2) neededTotal = 4; // /30 or /31
    if (req.neededHosts === 1) neededTotal = 2; // /31 or /32

    let hostBits = Math.ceil(Math.log2(neededTotal));
    if (hostBits < 2 && req.neededHosts > 2) hostBits = 2;
    const reqCidr = 32 - hostBits;
    const blockSize = Math.pow(2, hostBits);

    if (totalAllocated + blockSize > maxAvailableHosts || reqCidr < baseCidr) {
      return {
        subnets: result,
        error: `Espacio insuficiente en la red /${baseCidr} para alojar la subred "${req.name}" (${req.neededHosts} hosts).`,
      };
    }

    const sub = analyzeSubnet(intToIPv4(currentNetInt), reqCidr);
    if (!sub) break;

    result.push({
      name: req.name,
      network: sub.network,
      cidr: reqCidr,
      mask: sub.mask,
      range: `${sub.firstHost} - ${sub.lastHost}`,
      broadcast: sub.broadcast,
      usableHosts: sub.usableHosts,
      allocatedHosts: blockSize,
    });

    currentNetInt = (currentNetInt + blockSize) >>> 0;
    totalAllocated += blockSize;
  }

  return { subnets: result, error: null };
}

/**
 * Export Subnet rows to CSV format
 */
export function exportSubnetsToCsv(rows: SubnetRow[]): string {
  const headers = ['Nombre', 'Red', 'CIDR', 'Máscara', 'Rango de Hosts', 'Broadcast', 'Hosts Útiles', 'Bloque Total'];
  const lines = [headers.join(',')];
  for (const r of rows) {
    lines.push(
      [
        `"${r.name}"`,
        r.network,
        `/${r.cidr}`,
        r.mask,
        `"${r.range}"`,
        r.broadcast,
        r.usableHosts,
        r.allocatedHosts,
      ].join(',')
    );
  }
  return lines.join('\n');
}
