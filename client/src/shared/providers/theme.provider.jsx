import { useEffect } from "react";
import { useSelector } from "react-redux";
import { selectThemeMode } from "@/shared/state/slices/theme.slice";

export function ThemeProvider({ children }) {
  const mode = useSelector(selectThemeMode);

  useEffect(() => {
    const root = window.document.documentElement;

    const applyTheme = (themeMode) => {
      root.classList.remove("light", "dark");

      if (themeMode === "system") {
        const systemDark = window.matchMedia(
          "(prefers-color-scheme: dark)",
        ).matches;
        root.classList.add(systemDark ? "dark" : "light");
      } else {
        root.classList.add(themeMode);
      }
    };

    applyTheme(mode);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = (e) => {
      if (mode === "system") {
        root.classList.remove("light", "dark");
        root.classList.add(e.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", listener);

    return () => mediaQuery.removeEventListener("change", listener);
  }, [mode]);

  return children;
}
