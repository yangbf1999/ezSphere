import { useEffect, useState } from "react";
import {
  SIDEBAR_COMPACT_BREAKPOINT,
  SIDEBAR_WIDTH,
  SIDEBAR_WIDTH_COMPACT,
} from "@/config/navigation";

function resolveSidebarWidth(viewportWidth: number) {
  return viewportWidth <= SIDEBAR_COMPACT_BREAKPOINT
    ? SIDEBAR_WIDTH_COMPACT
    : SIDEBAR_WIDTH;
}

export function useSidebarWidth() {
  const [width, setWidth] = useState(() =>
    typeof window === "undefined"
      ? SIDEBAR_WIDTH
      : resolveSidebarWidth(window.innerWidth),
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia(
      `(max-width: ${SIDEBAR_COMPACT_BREAKPOINT}px)`,
    );

    const syncWidth = () => {
      const next = resolveSidebarWidth(window.innerWidth);
      setWidth(next);
      document.documentElement.style.setProperty(
        "--shell-sidebar-width",
        `${next}px`,
      );
    };

    syncWidth();
    mediaQuery.addEventListener("change", syncWidth);
    window.addEventListener("resize", syncWidth);

    return () => {
      mediaQuery.removeEventListener("change", syncWidth);
      window.removeEventListener("resize", syncWidth);
    };
  }, []);

  return width;
}
