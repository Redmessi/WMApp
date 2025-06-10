import { ChangeEvent, useContext, useRef } from "react";
import { ResultsContext } from "../contexts/ResultsContext";

export default function TopMenu({ setCurrent }: { setCurrent: (val: string) => void }) {
  const { results, setResults } = useContext(ResultsContext);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getSettings = () => ({
    drawChance: Number(localStorage.getItem("u") || 10),
    monteCarloRuns: Number(localStorage.getItem("mc") || 10000),
    formVsRanking: Number(localStorage.getItem("form") || 50),
  });

  const handleSaveAll = () => {
    const allData = { settings: getSettings(), results };
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: "application/json" });
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

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (
        parsed.settings &&
        typeof parsed.settings.drawChance === "number" &&
        typeof parsed.settings.monteCarloRuns === "number" &&
        typeof parsed.settings.formVsRanking === "number" &&
        parsed.results &&
        typeof parsed.results === "object"
      ) {
        setResults(parsed.results);
        localStorage.setItem("wmquali_results", JSON.stringify(parsed.results));
        localStorage.setItem("u", String(parsed.settings.drawChance));
        localStorage.setItem("mc", String(parsed.settings.monteCarloRuns));
        localStorage.setItem("form", String(parsed.settings.formVsRanking));
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
    <div className="bg-[#202225] text-white flex items-center gap-4 px-4 py-2 shadow">
      <button onClick={handleImportClick} className="hover:underline">📂 Öffnen</button>
      <button onClick={handleSaveAll} className="hover:underline">💾 Speichern</button>
      <button onClick={() => setCurrent('Parameter')} className="hover:underline">⚙️ Einstellungen</button>
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
