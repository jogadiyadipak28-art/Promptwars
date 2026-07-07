import { useState, useCallback } from 'react';

/**
 * Copy text to clipboard with a temporary "copied" flag.
 * @param {number} resetMs How long to show copied state (default 2 s)
 */
export default function useClipboard(resetMs = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback((text) => {
    if (!text) return;
    navigator.clipboard.writeText(text).catch(() => {
      // Clipboard API may be blocked — fail silently
    });
    setCopied(true);
    setTimeout(() => setCopied(false), resetMs);
  }, [resetMs]);

  return { copied, copy };
}
