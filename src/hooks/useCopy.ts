import { useState, useCallback } from 'react';

export function useCopy(timeoutMs = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(
    async (text: string): Promise<boolean> => {
      if (!text) return false;

      let success = false;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(text);
          success = true;
        } else {
          // Fallback using textarea execCommand
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'fixed';
          textArea.style.left = '-999999px';
          textArea.style.top = '-999999px';
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          success = document.execCommand('copy');
          textArea.remove();
        }
      } catch (err) {
        console.error('Failed to copy text: ', err);
        success = false;
      }

      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), timeoutMs);
      }
      return success;
    },
    [timeoutMs]
  );

  return { copied, copy };
}
