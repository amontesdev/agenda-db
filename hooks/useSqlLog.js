"use client";

import { useCallback, useState } from "react";

export function useSqlLog(maxEntries = 12) {
  const [sqlLog, setSqlLog] = useState([]);

  const pushLog = useCallback((msg, type = "info") => {
    setSqlLog((logs) => {
      const next = [...logs, { msg, type, ts: new Date().toLocaleTimeString("es-CO") }];
      return next.slice(-maxEntries);
    });
  }, [maxEntries]);

  return { sqlLog, pushLog };
}
