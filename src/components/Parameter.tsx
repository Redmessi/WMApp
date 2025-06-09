// src/components/Parameter.tsx
import { useState, useContext, useRef, ChangeEvent, useEffect } from "react";
import { ResultsContext } from "../contexts/ResultsContext";
import { saveToFile } from "../utils/saveLoad";

export default function Parameter() {
  // Parameter-State, initial aus localStorage, default 10/500/50
  const [drawChance, setDrawChance] = useState(
    () => Number(localStorage.getItem("u")) || 10
  );
  const [monteCarloRuns, setMonteCarloRuns] = useState(
    () => Number(localStorage.getItem("mc")) || 500
  );
  const [formVsRanking, setFormVsRanking] = useState(
    () => Number(localStorage.getItem("form")) || 50
  );

  // Gruppendaten aus Context
  const { results, setResults } = useContext(ResultsContext);

  // Ref für verstecktes File-Input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Automatisch speichern bei Parameteränderungen ─────────────
  useEffect(() => {
    localStorage.setItem("u", String(drawChance));
    localStorage.setItem("mc", String(monteCarloRuns));
    localStorage.setItem("form", String(formVsRanking));
    const settings = { drawChance, monteCarloRuns, formVsRanking };
    saveToFile({ settings, results }).catch(() => {});
  }, [drawChance, monteCarloRuns, formVsRanking, results]);

  // 1) Speichern (Export): alles in einem JSON
  const handleSaveAll = () => {
    // erst Settings in localStorage
    localStorage.setItem("u", String(drawChance));
    localStorage.setItem("mc", String(monteCarloRuns));
    localStorage.setItem("form", String(formVsRanking));

    const allData = {
      settings: { drawChance, monteCarloRuns, formVsRanking },
      results,
    };
    const blob = new Blob([JSON.stringify(allData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "wmquali_complete_save.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert("✅ Alle Daten (Gruppen + Parameter) zum Speichern vorbereitet.");
  };

  // 2) Import starten
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  // 3) Datei einlesen und Context + Parameter setzen
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      // Validierung
      if (
        parsed.settings &&
        typeof parsed.settings.drawChance === "number" &&
        typeof parsed.settings.monteCarloRuns === "number" &&
        typeof parsed.settings.formVsRanking === "number" &&
        parsed.results &&
        typeof parsed.results === "object"
      ) {
        // 1) Gruppenergebnisse zurücksetzen
        setResults(parsed.results);
        localStorage.setItem("wmquali_results", JSON.stringify(parsed.results));
        // 2) Parameter zurücksetzen
        setDrawChance(parsed.settings.drawChance);
        setMonteCarloRuns(parsed.settings.monteCarloRuns);
        setFormVsRanking(parsed.settings.formVsRanking);
        localStorage.setItem("u", String(parsed.settings.drawChance));
        localStorage.setItem("mc", String(parsed.settings.monteCarloRuns));
        localStorage.setItem("form", String(parsed.settings.formVsRanking));
        saveToFile({ settings: parsed.settings, results: parsed.results }).catch(() => {});
        alert("✅ Alle Daten erfolgreich geladen!");
      } else {
        throw new Error("Ungültiges Format");
      }
    } catch (err) {
      console.error(err);
      alert("❌ Fehler beim Laden: ungültige Datei.");
    } finally {
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <h2 className="text-2xl font-bold">⚙️ Simulationseinstellungen & Save</h2>

      {/* Unentschieden-Wahrscheinlichkeit */}
      <div>
        <label className="block mb-1 font-semibold">
          Unentschieden (u): {drawChance}%
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={drawChance}
          onChange={(e) => setDrawChance(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Monte Carlo Runs */}
      <div>
        <label className="block mb-1 font-semibold">
          Monte Carlo Durchläufe
        </label>
        <input
          type="number"
          value={monteCarloRuns}
          onChange={(e) => setMonteCarloRuns(Number(e.target.value))}
          className="bg-[#2f3136] text-white border border-white/20 p-2 w-full"
        />
      </div>

      {/* Form vs. Rang */}
      <div>
        <label className="block mb-1 font-semibold">
          Form vs. Rang: {formVsRanking}% Form
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={formVsRanking}
          onChange={(e) => setFormVsRanking(Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Save + Import Buttons */}
      <div className="flex flex-wrap gap-4 mt-4">
        <button
          onClick={handleSaveAll}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          💾 Alle Daten speichern
        </button>
        <button
          onClick={handleImportClick}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          📂 Daten importieren
        </button>
      </div>

      {/* Verstecktes File-Input */}
      <input
        type="file"
        accept="application/json"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
