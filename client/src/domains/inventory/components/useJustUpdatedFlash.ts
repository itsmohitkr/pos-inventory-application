import { useState } from 'react';

/**
 * "Recently updated" visual confirmation on a batch card — shows for
 * `durationMs`, then clears itself. Previously duplicated 3 times (New
 * Batch, Edit Batch, Quick Stock) with an identical setTimeout(5000) at
 * each save-success call site.
 */
export const useJustUpdatedFlash = (durationMs = 5000) => {
  const [justUpdatedId, setJustUpdatedId] = useState<number | null>(null);

  const flash = (id: number) => {
    setJustUpdatedId(id);
    setTimeout(() => {
      setJustUpdatedId((curr) => (curr === id ? null : curr));
    }, durationMs);
  };

  return { justUpdatedId, flash };
};
