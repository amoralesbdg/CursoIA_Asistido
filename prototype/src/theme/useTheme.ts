import { useCallback, useEffect, useState } from "react";

export type ThemePref = "light" | "dark" | "system";

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem("theme");
    if (v === "light" || v === "dark") return v;
  } catch {
    /* almacenamiento no disponible: se usa el sistema */
  }
  return "system";
}

/** C.7 — Sistema por defecto, override manual persistente. */
export function useTheme() {
  const [pref, setPref] = useState<ThemePref>(readPref);

  useEffect(() => {
    const root = document.documentElement;
    if (pref === "system") root.removeAttribute("data-theme");
    else root.dataset.theme = pref;
    try {
      if (pref === "system") localStorage.removeItem("theme");
      else localStorage.setItem("theme", pref);
    } catch {
      /* ignorar */
    }
  }, [pref]);

  const set = useCallback((p: ThemePref) => setPref(p), []);
  return { pref, set };
}
