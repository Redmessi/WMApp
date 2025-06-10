// src/contexts/ResultsContext.tsx
import { createContext, ReactNode, useState, useEffect } from "react";
import { saveToFile, loadLatestFile } from "../utils/saveLoad";

export interface MatchResult {
  spieltag: number;
  datum: string;
  heim: string;
  auswärts: string;
  homeGoals: number | "";
  awayGoals: number | "";
}


interface ResultsContextType {
  results: Record<string, MatchResult[]>;
  setResults: React.Dispatch<React.SetStateAction<Record<string, MatchResult[]>>>;
}

// Context mit Default-Werten
export const ResultsContext = createContext<ResultsContextType>({
  results: {},
  setResults: () => {}
});

const STORAGE_KEY = "wmquali_results";

export function ResultsProvider({ children }: { children: ReactNode }) {
  const [results, setResults] = useState<Record<string, MatchResult[]>>({});

  // ─── 1) Beim ersten Mount aus localStorage laden ───────────────
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setResults(JSON.parse(raw));
      }
    } catch {
      // Parse-Fehler ignorieren
    }
  }, []);

  // ─── 1b) Danach ggf. neuesten Autosave laden ───────────────────
  useEffect(() => {
    loadLatestFile().then(save => {
      if (save) {
        setResults(save.results);
        try {
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(save.results));
          window.localStorage.setItem("u", String(save.settings.drawChance));
          window.localStorage.setItem("mc", String(save.settings.monteCarloRuns));
          window.localStorage.setItem("form", String(save.settings.formVsRanking));
        } catch {}
      }
    });
  }, []);

  // ─── 2) Bei jeder Änderung des States in localStorage schreiben ──
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
    } catch {
      // Speicher voll oder blockiert → ignorieren
    }
    const settings = {
      drawChance: Number(window.localStorage.getItem("u") ?? 10),
      monteCarloRuns: Number(window.localStorage.getItem("mc") ?? 10000),
      formVsRanking: Number(window.localStorage.getItem("form") ?? 50),
    };
    saveToFile({ settings, results }).catch(() => {});
  }, [results]);

  return (
    <ResultsContext.Provider value={{ results, setResults }}>
      {children}
    </ResultsContext.Provider>
  );
}
