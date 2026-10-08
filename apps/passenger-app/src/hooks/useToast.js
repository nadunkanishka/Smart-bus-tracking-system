import { useEffect, useState } from 'react';

// One toast message at a time; it clears itself after 3.5 s.
export function useToast() {
  const [toastMsg, setToastMsg] = useState('');

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMsg) return undefined;
    const t = setTimeout(() => setToastMsg(''), 3500);
    return () => clearTimeout(t);
  }, [toastMsg]);

  function showToast(msg) {
    setToastMsg(msg);
  }

  return { toastMsg, showToast };
}
