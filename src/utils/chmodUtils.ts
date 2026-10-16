// Pure logic utility for CHMOD permissions and Umask calculations

export interface PermissionState {
  // Special bits
  setuid: boolean;
  setgid: boolean;
  sticky: boolean;
  // User (owner)
  userRead: boolean;
  userWrite: boolean;
  userExecute: boolean;
  // Group
  groupRead: boolean;
  groupWrite: boolean;
  groupExecute: boolean;
  // Others
  othersRead: boolean;
  othersWrite: boolean;
  othersExecute: boolean;
}

export const DEFAULT_PERMISSIONS: PermissionState = {
  setuid: false,
  setgid: false,
  sticky: false,
  userRead: true,
  userWrite: true,
  userExecute: true,
  groupRead: true,
  groupWrite: false,
  groupExecute: true,
  othersRead: true,
  othersWrite: false,
  othersExecute: true,
};

export interface ChmodPreset {
  octal: string;
  name: string;
  desc: string;
  isDangerous?: boolean;
}

export const CHMOD_PRESETS: ChmodPreset[] = [
  {
    octal: '644',
    name: 'Archivos web estándar',
    desc: 'Lectura/escritura para el dueño, solo lectura para grupo y otros (HTML, CSS, imágenes).',
  },
  {
    octal: '755',
    name: 'Carpetas y scripts ejecutables',
    desc: 'Acceso total para dueño; grupo y otros pueden leer y entrar/ejecutar.',
  },
  {
    octal: '600',
    name: 'Claves privadas / Confidencial',
    desc: 'Solo lectura y escritura para el dueño. Nadie más tiene acceso (~/.ssh/id_rsa).',
  },
  {
    octal: '700',
    name: 'Directorios privados',
    desc: 'Acceso exclusivo total para el dueño (~/.ssh, carpetas personales).',
  },
  {
    octal: '775',
    name: 'Colaboración en equipo',
    desc: 'Control total para dueño y miembros del grupo de trabajo.',
  },
  {
    octal: '1777',
    name: 'Directorio temporal (/tmp)',
    desc: 'Cualquiera puede crear archivos, pero solo el dueño puede borrarlos (Sticky bit activo).',
  },
  {
    octal: '777',
    name: 'Permiso total universal',
    desc: 'Peligroso: cualquiera puede leer, modificar y borrar todo.',
    isDangerous: true,
  },
];

/**
 * Convert permission state to 3 or 4-digit octal string
 */
export function stateToOctal(state: PermissionState): string {
  const special = (state.setuid ? 4 : 0) + (state.setgid ? 2 : 0) + (state.sticky ? 1 : 0);
  const u = (state.userRead ? 4 : 0) + (state.userWrite ? 2 : 0) + (state.userExecute ? 1 : 0);
  const g = (state.groupRead ? 4 : 0) + (state.groupWrite ? 2 : 0) + (state.groupExecute ? 1 : 0);
  const o = (state.othersRead ? 4 : 0) + (state.othersWrite ? 2 : 0) + (state.othersExecute ? 1 : 0);

  if (special > 0) {
    return `${special}${u}${g}${o}`;
  }
  return `${u}${g}${o}`;
}

/**
 * Parse octal string (3 or 4 digits) into PermissionState
 */
export function octalToState(octal: string): PermissionState | null {
  const clean = octal.trim();
  if (!/^[0-7]{3,4}$/.test(clean)) return null;

  let special = 0;
  let u = 0;
  let g = 0;
  let o = 0;

  if (clean.length === 4) {
    special = parseInt(clean[0], 8);
    u = parseInt(clean[1], 8);
    g = parseInt(clean[2], 8);
    o = parseInt(clean[3], 8);
  } else {
    u = parseInt(clean[0], 8);
    g = parseInt(clean[1], 8);
    o = parseInt(clean[2], 8);
  }

  return {
    setuid: (special & 4) !== 0,
    setgid: (special & 2) !== 0,
    sticky: (special & 1) !== 0,
    userRead: (u & 4) !== 0,
    userWrite: (u & 2) !== 0,
    userExecute: (u & 1) !== 0,
    groupRead: (g & 4) !== 0,
    groupWrite: (g & 2) !== 0,
    groupExecute: (g & 1) !== 0,
    othersRead: (o & 4) !== 0,
    othersWrite: (o & 2) !== 0,
    othersExecute: (o & 1) !== 0,
  };
}

/**
 * Convert permission state to 9/10-character symbolic notation (rwxr-xr--)
 */
export function stateToSymbolic(state: PermissionState, isDirectory = false): string {
  const prefix = isDirectory ? 'd' : '-';

  // User
  const uR = state.userRead ? 'r' : '-';
  const uW = state.userWrite ? 'w' : '-';
  let uX = state.userExecute ? 'x' : '-';
  if (state.setuid) {
    uX = state.userExecute ? 's' : 'S';
  }

  // Group
  const gR = state.groupRead ? 'r' : '-';
  const gW = state.groupWrite ? 'w' : '-';
  let gX = state.groupExecute ? 'x' : '-';
  if (state.setgid) {
    gX = state.groupExecute ? 's' : 'S';
  }

  // Others
  const oR = state.othersRead ? 'r' : '-';
  const oW = state.othersWrite ? 'w' : '-';
  let oX = state.othersExecute ? 'x' : '-';
  if (state.sticky) {
    oX = state.othersExecute ? 't' : 'T';
  }

  return `${prefix}${uR}${uW}${uX}${gR}${gW}${gX}${oR}${oW}${oX}`;
}

/**
 * Generate human-readable explanation in Spanish
 */
export function explainPermissions(state: PermissionState): {
  userSummary: string;
  groupSummary: string;
  othersSummary: string;
  specialSummary?: string;
  isDangerous: boolean;
} {
  const describe = (r: boolean, w: boolean, x: boolean) => {
    const perms: string[] = [];
    if (r) perms.push('Lectura (ver contenido)');
    if (w) perms.push('Escritura (modificar y borrar)');
    if (x) perms.push('Ejecución (correr script o entrar a carpeta)');
    return perms.length > 0 ? perms.join(', ') : 'Sin acceso (denegado)';
  };

  const userSummary = describe(state.userRead, state.userWrite, state.userExecute);
  const groupSummary = describe(state.groupRead, state.groupWrite, state.groupExecute);
  const othersSummary = describe(state.othersRead, state.othersWrite, state.othersExecute);

  const specials: string[] = [];
  if (state.setuid) specials.push('SUID (se ejecuta con privilegios del dueño)');
  if (state.setgid) specials.push('SGID (archivos heredan el grupo)');
  if (state.sticky) specials.push('Sticky bit (solo el creador puede eliminar archivos)');

  const isDangerous = state.othersWrite;

  return {
    userSummary,
    groupSummary,
    othersSummary,
    specialSummary: specials.length > 0 ? specials.join(' • ') : undefined,
    isDangerous,
  };
}

/**
 * Calculate Default Permissions from Umask
 * Standard base: Files = 0666, Directories = 0777
 */
export function computeFromUmask(umaskStr: string) {
  const clean = umaskStr.trim().replace(/^0+/, '');
  const padded = (clean || '0').padStart(3, '0').slice(-3);
  if (!/^[0-7]{3}$/.test(padded)) return null;

  const umaskInt = parseInt(padded, 8);
  const filePermInt = 0o666 & ~umaskInt;
  const dirPermInt = 0o777 & ~umaskInt;

  const fileOctal = filePermInt.toString(8).padStart(3, '0');
  const dirOctal = dirPermInt.toString(8).padStart(3, '0');

  const fileState = octalToState(fileOctal);
  const dirState = octalToState(dirOctal);

  return {
    umaskOctal: padded,
    fileOctal,
    fileSymbolic: fileState ? stateToSymbolic(fileState, false) : '',
    dirOctal,
    dirSymbolic: dirState ? stateToSymbolic(dirState, true) : '',
  };
}
