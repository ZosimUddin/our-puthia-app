export type ThemeMode = "system" | "light" | "dark";

export const getSavedTheme = (): ThemeMode => {
  if (typeof localStorage === "undefined") return "light";
  const saved = localStorage.getItem("app_theme") as ThemeMode;
  if (saved === "dark" || saved === "light" || saved === "system") {
    return saved;
  }
  return "light"; // Default to light theme
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
    // System mode
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    if (isDark) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }

  // Dispatch custom window event for any reactive listeners
  window.dispatchEvent(new CustomEvent("app_theme_changed", { detail: { mode } }));
};

/**
 * Initialize theme listener for color scheme changes
 */
export const initThemeListener = () => {
  if (typeof window === "undefined" || !window.matchMedia) return;
  
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handleMediaChange = () => {
    const currentMode = getSavedTheme();
    if (currentMode === "system") {
      applyTheme("system");
    }
  };

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener("change", handleMediaChange);
  } else {
    mediaQuery.addListener(handleMediaChange);
  }
  
  // Initial apply
  applyTheme(getSavedTheme());
};
