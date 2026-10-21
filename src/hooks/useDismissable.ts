import { useEffect, useRef } from 'react';

/**
 * Closes a floating menu on outside click or Escape. Shared by every dropdown
 * in the topbar so the behaviour stays consistent.
 */
export function useDismissable<T extends HTMLElement>(
  open: boolean,
  close: () => void,
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        close();
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        close();
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, close]);

  return ref;
}