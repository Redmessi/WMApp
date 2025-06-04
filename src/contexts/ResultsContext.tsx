// src/contexts/ResultsContext.tsx
import { createContext, ReactNode, useState, useEffect } from "react";

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

  // ─── 2) Bei jeder Änderung des States in localStorage schreiben ──
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
    } catch {
      // Speicher voll oder blockiert → ignorieren
    }
  }, [results]);

  return (
    <ResultsContext.Provider value={{ results, setResults }}>
      {children}
    </ResultsContext.Provider>
  );
}
