// Web Worker to execute Regular Expressions safely without freezing UI

export interface RegexWorkerRequest {
  id: string;
  pattern: string;
  flags: string;
  text: string;
  replacement?: string;
  isReplaceMode?: boolean;
}

export interface RegexMatchItem {
  index: number;
  length: number;
  text: string;
  groups: { name?: string; value: string; index?: number }[];
}

export interface RegexWorkerResponse {
  id: string;
  success: boolean;
  matches: RegexMatchItem[];
  replacedText?: string;
  totalMatchesCount: number;
  isTruncated: boolean;
  errorMessage?: string;
  executionTimeMs: number;
}

self.onmessage = (e: MessageEvent<RegexWorkerRequest>) => {
  const { id, pattern, flags, text, replacement = '', isReplaceMode = false } = e.data;
  const start = performance.now();

  try {
    const regex = new RegExp(pattern, flags);
    const matches: RegexMatchItem[] = [];
    const maxMatches = 1000;
    let totalMatchesCount = 0;
    let isTruncated = false;

    if (regex.global) {
      let m: RegExpExecArray | null;
      let lastIndex = 0;

      while ((m = regex.exec(text)) !== null) {
        totalMatchesCount++;

        if (matches.length < maxMatches) {
          const groupList: { name?: string; value: string; index?: number }[] = [];

          // Numbered groups
          for (let i = 1; i < m.length; i++) {
            groupList.push({
              name: `$${i}`,
              value: m[i] !== undefined ? m[i] : '',
              index: i,
            });
          }

          // Named groups
          if (m.groups) {
            for (const [name, val] of Object.entries(m.groups)) {
              groupList.push({
                name,
                value: val !== undefined ? val : '',
              });
            }
          }

          matches.push({
            index: m.index,
            length: m[0].length,
            text: m[0],
            groups: groupList,
          });
        } else {
          isTruncated = true;
        }

        // Avoid infinite loop on zero-width match (e.g. ^ or \b or .*)
        if (regex.lastIndex === lastIndex) {
          regex.lastIndex++;
        }
        lastIndex = regex.lastIndex;

        // Safety break if matching too many
        if (totalMatchesCount >= 5000) {
          isTruncated = true;
          break;
        }
      }
    } else {
      // Non-global regex
      const m = regex.exec(text);
      if (m) {
        totalMatchesCount = 1;
        const groupList: { name?: string; value: string; index?: number }[] = [];
        for (let i = 1; i < m.length; i++) {
          groupList.push({
            name: `$${i}`,
            value: m[i] !== undefined ? m[i] : '',
            index: i,
          });
        }
        if (m.groups) {
          for (const [name, val] of Object.entries(m.groups)) {
            groupList.push({ name, value: val !== undefined ? val : '' });
          }
        }
        matches.push({
          index: m.index,
          length: m[0].length,
          text: m[0],
          groups: groupList,
        });
      }
    }

    let replacedText = '';
    if (isReplaceMode) {
      replacedText = text.replace(regex, replacement);
    }

    const duration = performance.now() - start;

    const res: RegexWorkerResponse = {
      id,
      success: true,
      matches,
      replacedText,
      totalMatchesCount,
      isTruncated,
      executionTimeMs: Math.round(duration * 10) / 10,
    };
    self.postMessage(res);
  } catch (err: any) {
    const duration = performance.now() - start;
    const res: RegexWorkerResponse = {
      id,
      success: false,
      matches: [],
      totalMatchesCount: 0,
      isTruncated: false,
      errorMessage: err.message || 'Error de sintaxis en la expresión regular.',
      executionTimeMs: Math.round(duration * 10) / 10,
    };
    self.postMessage(res);
  }
};
