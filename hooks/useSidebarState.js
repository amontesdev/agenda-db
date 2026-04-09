"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const MOBILE_BREAKPOINT = 768;

export function useSidebarState() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileView, setIsMobileView] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const value = typeof window !== "undefined" && window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobileView(value);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobileView) {
      setSidebarOpen(true);
    }
  }, [isMobileView]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const isMobile = useMemo(() => {
    if (typeof window === "undefined") return false;
    return window.innerWidth < MOBILE_BREAKPOINT;
  }, []);

  return {
    sidebarOpen,
    setSidebarOpen,
    isMobileView,
    toggleSidebar,
    isMobile,
  };
}
