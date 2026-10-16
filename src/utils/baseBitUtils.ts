// Utility functions for Bases, Bits, IEEE-754, and ASCII/Unicode

export const BASE_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Validates whether character string is valid for a given base (2..36).
 */
export function validateForBase(str: string, base: number): { isValid: boolean; invalidChars: string[] } {
  const allowed = BASE_CHARS.slice(0, base);
  const clean = str.toUpperCase().replace(/^[-+]/, '').replace('.', '');
  const invalidChars: string[] = [];
  for (const char of clean) {
    if (!allowed.includes(char) && !invalidChars.includes(char)) {
      invalidChars.push(char);
    }
  }
  return { isValid: invalidChars.length === 0, invalidChars };
}

/**
 * Convert BigInt to arbitrary base string (2..36)
 */
export function bigIntToBase(val: bigint, base: number): string {
  if (val === 0n) return '0';
  const isNeg = val < 0n;
  let num = isNeg ? -val : val;
  const bigBase = BigInt(base);
  let res = '';
  while (num > 0n) {
    const rem = Number(num % bigBase);
    res = BASE_CHARS[rem] + res;
    num = num / bigBase;
  }
  return (isNeg ? '-' : '') + res;
}

/**
 * Parse arbitrary base string into BigInt (integer part)
 */
export function baseToBigInt(str: string, base: number): bigint | null {
  const clean = str.trim().toUpperCase();
  if (!clean || clean === '-' || clean === '+') return 0n;
  const isNeg = clean.startsWith('-');
  const unsignedStr = clean.replace(/^[-+]/, '');
  if (!unsignedStr) return 0n;

  const allowed = BASE_CHARS.slice(0, base);
  const bigBase = BigInt(base);
  let acc = 0n;
  for (const ch of unsignedStr) {
    const val = allowed.indexOf(ch);
    if (val === -1) return null;
    acc = acc * bigBase + BigInt(val);
  }
  return isNeg ? -acc : acc;
}

/**
 * Converts fractional part from base 10 (0.xxx) to target base
 */
export function fractionalToBase(fraction: number, base: number, maxDigits = 16): string {
  if (fraction === 0) return '';
  let f = Math.abs(fraction);
  let res = '';
  let count = 0;
  while (f > 0 && count < maxDigits) {
    f *= base;
    const digit = Math.floor(f);
    res += BASE_CHARS[digit];
    f -= digit;
    count++;
  }
  return res;
}

/**
 * Converts fractional string in given base to base 10 number (0.xxx)
 */
export function baseToFractional(str: string, base: number): number {
  const clean = str.toUpperCase().trim();
  let acc = 0;
  let divisor = base;
  for (const ch of clean) {
    const val = BASE_CHARS.slice(0, base).indexOf(ch);
    if (val === -1) break;
    acc += val / divisor;
    divisor *= base;
  }
  return acc;
}

/**
 * Format bit string into groups of 4 or 8
 */
export function formatBitGroups(bits: string, groupSize: 4 | 8 = 4): string {
  const clean = bits.replace(/\s/g, '');
  if (!clean) return '';
  const isNeg = clean.startsWith('-');
  const unsigned = isNeg ? clean.slice(1) : clean;
  const parts: string[] = [];
  const rem = unsigned.length % groupSize;
  if (rem > 0) {
    parts.push(unsigned.slice(0, rem));
  }
  for (let i = rem; i < unsigned.length; i += groupSize) {
    parts.push(unsigned.slice(i, i + groupSize));
  }
  return (isNeg ? '-' : '') + parts.join(' ');
}

/**
 * Mask BigInt to specific bit width
 */
export function maskToWidth(val: bigint, width: number): bigint {
  const mask = (1n << BigInt(width)) - 1n;
  return val & mask;
}

/**
 * Convert BigInt to unsigned bit string with exact width
 */
export function toExactBitString(val: bigint, width: number): string {
  const masked = maskToWidth(val, width);
  let s = masked.toString(2);
  while (s.length < width) {
    s = '0' + s;
  }
  return s.slice(-width);
}

/**
 * Interpret unsigned BigInt as signed 2's complement
 */
export function toSigned(val: bigint, width: number): bigint {
  const masked = maskToWidth(val, width);
  const signBit = 1n << BigInt(width - 1);
  if ((masked & signBit) !== 0n) {
    return masked - (1n << BigInt(width));
  }
  return masked;
}

/**
 * Bitwise operations for arbitrary width (8, 16, 32, 64)
 */
export function computeBitwiseOp(
  op: 'AND' | 'OR' | 'XOR' | 'NOT' | 'NAND' | 'NOR' | 'XNOR' | 'SHL' | 'SHR_A' | 'SHR_L' | 'ROTL' | 'ROTR',
  a: bigint,
  b: bigint,
  width: number
): { result: bigint; bitString: string } {
  const bigWidth = BigInt(width);
  const mask = (1n << bigWidth) - 1n;
  const maskedA = a & mask;
  const maskedB = b & mask;
  let res = 0n;

  switch (op) {
    case 'AND':
      res = maskedA & maskedB;
      break;
    case 'OR':
      res = maskedA | maskedB;
      break;
    case 'XOR':
      res = maskedA ^ maskedB;
      break;
    case 'NOT':
      res = ~maskedA & mask;
      break;
    case 'NAND':
      res = ~(maskedA & maskedB) & mask;
      break;
    case 'NOR':
      res = ~(maskedA | maskedB) & mask;
      break;
    case 'XNOR':
      res = ~(maskedA ^ maskedB) & mask;
      break;
    case 'SHL': {
      const shift = Number(maskedB % bigWidth);
      res = (maskedA << BigInt(shift)) & mask;
      break;
    }
    case 'SHR_L': {
      const shift = Number(maskedB % bigWidth);
      res = (maskedA >> BigInt(shift)) & mask;
      break;
    }
    case 'SHR_A': {
      const shift = Number(maskedB % bigWidth);
      const signedA = toSigned(maskedA, width);
      const shifted = signedA >> BigInt(shift);
      res = shifted & mask;
      break;
    }
    case 'ROTL': {
      const shift = Number(maskedB % bigWidth);
      res = ((maskedA << BigInt(shift)) | (maskedA >> (bigWidth - BigInt(shift)))) & mask;
      break;
    }
    case 'ROTR': {
      const shift = Number(maskedB % bigWidth);
      res = ((maskedA >> BigInt(shift)) | (maskedA << (bigWidth - BigInt(shift)))) & mask;
      break;
    }
  }

  return {
    result: res,
    bitString: toExactBitString(res, width),
  };
}

/**
 * Complements calculation (Sign-Magnitude, 1's Complement, 2's Complement)
 */
export function computeComplements(val: bigint, width: number) {
  const minVal = -(1n << BigInt(width - 1));
  const maxVal = (1n << BigInt(width - 1)) - 1n;
  const inRange = val >= minVal && val <= maxVal;

  const mask = (1n << BigInt(width)) - 1n;
  const isNeg = val < 0n;
  const absVal = isNeg ? -val : val;

  // Sign-Magnitude: Bit 0 is sign, remaining width-1 is magnitude
  const magBits = (absVal & ((1n << BigInt(width - 1)) - 1n)).toString(2).padStart(width - 1, '0');
  const signMagnitudeBits = (isNeg ? '1' : '0') + magBits;

  // 1's Complement
  let onesComplementBits = '';
  if (!isNeg) {
    onesComplementBits = toExactBitString(absVal, width);
  } else {
    const posBits = toExactBitString(absVal, width);
    onesComplementBits = posBits.split('').map((b) => (b === '1' ? '0' : '1')).join('');
  }

  // 2's Complement
  let twosComplementBits = '';
  let twosSteps: { invertedBits: string; addedOne: string } | null = null;
  if (!isNeg) {
    twosComplementBits = toExactBitString(absVal, width);
  } else {
    const posBits = toExactBitString(absVal, width);
    const inverted = posBits.split('').map((b) => (b === '1' ? '0' : '1')).join('');
    const twos = (BigInt('0b' + inverted) + 1n) & mask;
    twosComplementBits = toExactBitString(twos, width);
    twosSteps = {
      invertedBits: inverted,
      addedOne: twosComplementBits,
    };
  }

  return {
    minVal,
    maxVal,
    inRange,
    signMagnitudeBits,
    onesComplementBits,
    twosComplementBits,
    twosSteps,
  };
}

/**
 * Decode 2's complement bit string to decimal
 */
export function decodeTwosComplement(bitStr: string): bigint {
  const clean = bitStr.replace(/\s/g, '');
  if (!clean) return 0n;
  const width = clean.length;
  const raw = BigInt('0b' + clean);
  return toSigned(raw, width);
}

/**
 * Step-by-step Binary Arithmetic (Notebook style)
 */
export interface BinaryAdditionStep {
  aBits: string;
  bBits: string;
  carries: string;
  sumBits: string;
  overflow: boolean;
}

export function stepBinaryAddition(a: bigint, b: bigint, width: number, isSigned = false): BinaryAdditionStep {
  const aStr = toExactBitString(a, width);
  const bStr = toExactBitString(b, width);
  let carry = 0;
  const sumChars: string[] = [];
  const carryChars: string[] = [];

  for (let i = width - 1; i >= 0; i--) {
    const bitA = Number(aStr[i]);
    const bitB = Number(bStr[i]);
    const total = bitA + bitB + carry;
    sumChars.unshift(String(total % 2));
    carry = total >= 2 ? 1 : 0;
    carryChars.unshift(String(carry));
  }

  const result = (a + b) & ((1n << BigInt(width)) - 1n);
  const finalBits = toExactBitString(result, width);

  // Signed overflow check
  let overflow = false;
  if (isSigned) {
    const signA = aStr[0] === '1';
    const signB = bStr[0] === '1';
    const signRes = finalBits[0] === '1';
    overflow = (signA === signB) && (signA !== signRes);
  } else {
    overflow = carry === 1;
  }

  return {
    aBits: aStr,
    bBits: bStr,
    carries: carryChars.join(''),
    sumBits: finalBits,
    overflow,
  };
}

export function stepBinaryMultiplication(a: bigint, b: bigint, width: number) {
  const aStr = toExactBitString(a, width);
  const bStr = toExactBitString(b, width);
  const partialProducts: { bits: string; shift: number }[] = [];

  for (let i = width - 1; i >= 0; i--) {
    const bitB = bStr[i];
    const shift = (width - 1) - i;
    const bits = bitB === '1' ? aStr : '0'.repeat(width);
    partialProducts.push({ bits, shift });
  }

  const result = (a * b) & ((1n << BigInt(width * 2)) - 1n);
  const resultBits = toExactBitString(result, width * 2);

  return {
    aBits: aStr,
    bBits: bStr,
    partialProducts,
    resultBits,
  };
}

/**
 * IEEE 754 Float Conversion (32-bit & 64-bit)
 */
export function numberToIEEE754(val: number, precision: 32 | 64 = 32) {
  const is32 = precision === 32;
  const buffer = new ArrayBuffer(is32 ? 4 : 8);
  const view = new DataView(buffer);

  if (is32) {
    view.setFloat32(0, val, false); // big-endian
  } else {
    view.setFloat64(0, val, false);
  }

  let hexStr = '';
  let binaryStr = '';
  const byteCount = is32 ? 4 : 8;
  for (let i = 0; i < byteCount; i++) {
    const b = view.getUint8(i);
    hexStr += b.toString(16).padStart(2, '0').toUpperCase();
    binaryStr += b.toString(2).padStart(8, '0');
  }

  const signBit = binaryStr[0];
  const expLen = is32 ? 8 : 11;
  const expBias = is32 ? 127 : 1023;
  const expBits = binaryStr.slice(1, 1 + expLen);
  const mantissaBits = binaryStr.slice(1 + expLen);

  const biasedExp = parseInt(expBits, 2);
  const actualExp = biasedExp === 0 ? 1 - expBias : biasedExp - expBias;

  let specialType = 'Normal';
  if (biasedExp === (is32 ? 255 : 2047)) {
    if (mantissaBits.includes('1')) specialType = 'NaN (Not a Number)';
    else specialType = signBit === '1' ? '-Infinito' : '+Infinito';
  } else if (biasedExp === 0) {
    if (!mantissaBits.includes('1')) specialType = signBit === '1' ? '-0 (Cero Negativo)' : '+0 (Cero Positivo)';
    else specialType = 'Subnormal (Denormalizado)';
  }

  // Exact reconstituted value
  let reconstituted = 0;
  if (is32) {
    reconstituted = view.getFloat32(0, false);
  } else {
    reconstituted = view.getFloat64(0, false);
  }
  const representationError = Math.abs(val - reconstituted);

  return {
    hex: hexStr,
    binary: binaryStr,
    sign: { bit: signBit, value: signBit === '1' ? -1 : 1 },
    exponent: { bits: expBits, biased: biasedExp, unbiased: actualExp, bias: expBias },
    mantissa: { bits: mantissaBits },
    specialType,
    representationError,
    reconstituted,
  };
}

/**
 * Decode IEEE 754 bit string or hex to number
 */
export function ieee754ToNumber(rawStr: string, precision: 32 | 64 = 32): number | null {
  const clean = rawStr.replace(/\s/g, '').toUpperCase();
  const is32 = precision === 32;
  const buffer = new ArrayBuffer(is32 ? 4 : 8);
  const view = new DataView(buffer);

  try {
    let bits = '';
    if (/^[01]+$/.test(clean)) {
      bits = clean.padEnd(is32 ? 32 : 64, '0').slice(0, is32 ? 32 : 64);
      for (let i = 0; i < (is32 ? 4 : 8); i++) {
        const byteStr = bits.slice(i * 8, (i + 1) * 8);
        view.setUint8(i, parseInt(byteStr, 2));
      }
    } else if (/^[0-9A-F]+$/.test(clean)) {
      const hex = clean.padEnd(is32 ? 8 : 16, '0').slice(0, is32 ? 8 : 16);
      for (let i = 0; i < (is32 ? 4 : 8); i++) {
        const byteHex = hex.slice(i * 2, (i + 1) * 2);
        view.setUint8(i, parseInt(byteHex, 16));
      }
    } else {
      return null;
    }

    return is32 ? view.getFloat32(0, false) : view.getFloat64(0, false);
  } catch {
    return null;
  }
}

/**
 * ASCII Table descriptions (0-127)
 */
export const ASCII_CONTROL_NAMES: Record<number, { name: string; desc: string }> = {
  0: { name: 'NUL', desc: 'Null character' },
  1: { name: 'SOH', desc: 'Start of Heading' },
  2: { name: 'STX', desc: 'Start of Text' },
  3: { name: 'ETX', desc: 'End of Text' },
  4: { name: 'EOT', desc: 'End of Transmission' },
  5: { name: 'ENQ', desc: 'Enquiry' },
  6: { name: 'ACK', desc: 'Acknowledge' },
  7: { name: 'BEL', desc: 'Bell / Alert' },
  8: { name: 'BS', desc: 'Backspace' },
  9: { name: 'HT', desc: 'Horizontal Tab' },
  10: { name: 'LF', desc: 'Line Feed (Newline)' },
  11: { name: 'VT', desc: 'Vertical Tab' },
  12: { name: 'FF', desc: 'Form Feed' },
  13: { name: 'CR', desc: 'Carriage Return' },
  14: { name: 'SO', desc: 'Shift Out' },
  15: { name: 'SI', desc: 'Shift In' },
  16: { name: 'DLE', desc: 'Data Link Escape' },
  17: { name: 'DC1', desc: 'Device Control 1' },
  18: { name: 'DC2', desc: 'Device Control 2' },
  19: { name: 'DC3', desc: 'Device Control 3' },
  20: { name: 'DC4', desc: 'Device Control 4' },
  21: { name: 'NAK', desc: 'Negative Acknowledge' },
  22: { name: 'SYN', desc: 'Synchronous Idle' },
  23: { name: 'ETB', desc: 'End of Transmission Block' },
  24: { name: 'CAN', desc: 'Cancel' },
  25: { name: 'EM', desc: 'End of Medium' },
  26: { name: 'SUB', desc: 'Substitute' },
  27: { name: 'ESC', desc: 'Escape' },
  28: { name: 'FS', desc: 'File Separator' },
  29: { name: 'GS', desc: 'Group Separator' },
  30: { name: 'RS', desc: 'Record Separator' },
  31: { name: 'US', desc: 'Unit Separator' },
  32: { name: 'SP', desc: 'Espacio (Space)' },
  127: { name: 'DEL', desc: 'Delete' },
};
