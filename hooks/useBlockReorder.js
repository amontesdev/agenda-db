"use client";

import { useCallback } from "react";

export function useBlockReorder(setBlocks) {
  const moveBlock = useCallback((index, direction) => {
    setBlocks((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const copy = [...prev];
      const [item] = copy.splice(index, 1);
      copy.splice(target, 0, item);
      return copy;
    });
  }, [setBlocks]);

  const moveBlockUp = useCallback((index) => moveBlock(index, -1), [moveBlock]);
  const moveBlockDown = useCallback((index) => moveBlock(index, 1), [moveBlock]);

  return { moveBlockUp, moveBlockDown };
}
