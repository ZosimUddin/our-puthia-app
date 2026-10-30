export type ThemeMode = "system" | "light" | "dark";

export const getSavedTheme = (): ThemeMode => {
  if (typeof localStorage === "undefined") return "system";
  const saved = localStorage.getItem("app_theme") as ThemeMode;
  if (saved === "dark" || saved === "light" || saved === "system") {
    return saved;
  }
  return "system";
};

export const applyTheme = (mode: ThemeMode) => {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("app_theme", mode);
  }

  const root = document.documentElement;
  
  if (mode === "dark") {
    root.classList.add("dark");
  } else if (mode === "light") {
    root.classList.remove("dark");
  } else {
    // system default mode
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (prefersDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }

  // Dispatch custom window event for any reactive listeners
  window.dispatchEvent(new CustomEvent("app_theme_changed", { detail: { mode } }));
};

/**
 * Initialize theme listener for system color scheme changes if mode is 'system'
 */
export const initThemeListener = () => {
  if (typeof window === "undefined" || !window.matchMedia) return;
  
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleMediaChange = (e: MediaQueryListEvent) => {
    const currentMode = getSavedTheme();
    if (currentMode === "system") {
      if (e.matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  };

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener("change", handleMediaChange);
  } else {
    mediaQuery.addListener(handleMediaChange);
  }
};
