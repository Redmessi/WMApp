// src/components/GruppeA.tsx
import { useContext, useEffect } from "react";
import { ResultsContext, MatchResult } from "../contexts/ResultsContext";

// Teams und ihre Länder
const teamsData = [
  { code: "GER", land: "Deutschland" },
  { code: "SVK", land: "Slowakei" },
  { code: "NIR", land: "Nordirland" },
  { code: "LUX", land: "Luxemburg" },
];

// Initiale Begegnungen für Gruppe A
const initialSpiele: MatchResult[] = [
  { spieltag: 1, datum: "04.09.2025", heim: "LUX", auswärts: "NIR", homeGoals: "", awayGoals: "" },
  { spieltag: 1, datum: "04.09.2025", heim: "SVK", auswärts: "GER", homeGoals: "", awayGoals: "" },
  { spieltag: 2, datum: "07.09.2025", heim: "LUX", auswärts: "SVK", homeGoals: "", awayGoals: "" },
  { spieltag: 2, datum: "07.09.2025", heim: "GER", auswärts: "NIR", homeGoals: "", awayGoals: "" },
  { spieltag: 3, datum: "10.10.2025", heim: "NIR", auswärts: "SVK", homeGoals: "", awayGoals: "" },
  { spieltag: 3, datum: "10.10.2025", heim: "GER", auswärts: "LUX", homeGoals: "", awayGoals: "" },
  { spieltag: 4, datum: "13.10.2025", heim: "NIR", auswärts: "GER", homeGoals: "", awayGoals: "" },
  { spieltag: 4, datum: "13.10.2025", heim: "SVK", auswärts: "LUX", homeGoals: "", awayGoals: "" },
  { spieltag: 5, datum: "14.11.2025", heim: "LUX", auswärts: "GER", homeGoals: "", awayGoals: "" },
  { spieltag: 5, datum: "14.11.2025", heim: "SVK", auswärts: "NIR", homeGoals: "", awayGoals: "" },
  { spieltag: 6, datum: "17.11.2025", heim: "NIR", auswärts: "LUX", homeGoals: "", awayGoals: "" },
  { spieltag: 6, datum: "17.11.2025", heim: "GER", auswärts: "SVK", homeGoals: "", awayGoals: "" },
];

// Hilfsfunktionen
const flagge = (code: string) => `/flags/${code.toLowerCase()}.svg`;
const landName = (code: string) => teamsData.find(t => t.code === code)?.land || code;

export default function GruppeA() {
  const { results, setResults } = useContext(ResultsContext);

  // Beim ersten Mounten initialSpiele in den Context setzen, falls noch nicht vorhanden
  useEffect(() => {
    if (!results["A"]) {
      setResults(r => ({ ...r, A: initialSpiele }));
    }
  }, [results, setResults]);

  // Matches aus Context (oder Fallback auf initial)
  const spiele = results["A"] ?? initialSpiele;

  // Ergebnis-Änderung in Context speichern
  const updateGoals = (
    idx: number,
    field: "homeGoals" | "awayGoals",
    value: string
  ) => {
    setResults(r => {
      const group = [...(r["A"] ?? initialSpiele)];
      group[idx] = {
        ...group[idx],
        [field]: value === "" ? "" : parseInt(value),
      };
      return { ...r, A: group };
    });
  };

  // Team-Statistiken berechnen und sortieren
  const teams = teamsData.map(team => {
    const spieleDesTeams = spiele.filter(
      s => s.heim === team.code || s.auswärts === team.code
    ).filter(s => s.homeGoals !== "" && s.awayGoals !== "");

    let tore = 0, gegentore = 0, punkte = 0;
    spieleDesTeams.forEach(s => {
      const th = Number(s.homeGoals), ta = Number(s.awayGoals);
      if (s.heim === team.code) {
        tore += th; gegentore += ta;
        punkte += th > ta ? 3 : th === ta ? 1 : 0;
      } else {
        tore += ta; gegentore += th;
        punkte += ta > th ? 3 : ta === th ? 1 : 0;
      }
    });

    return { ...team, spiele: spieleDesTeams.length, tore, gegentore, punkte };
  });

  const sortierteTeams = [...teams].sort((a, b) => {
    if (b.punkte !== a.punkte) return b.punkte - a.punkte;
    return (b.tore - b.gegentore) - (a.tore - a.gegentore);
  });

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h2 className="text-2xl font-bold">🌍 WM-Quali 2026 – Gruppe A</h2>

      {/* Tabelle */}
      <table className="w-full text-left border-collapse border border-white/20">
        <thead className="bg-[#202225]">
          <tr>
            <th className="p-2 border border-white/20">Flagge</th>
            <th className="p-2 border border-white/20">Land</th>
            <th className="p-2 border border-white/20">Spiele</th>
            <th className="p-2 border border-white/20">Tore</th>
            <th className="p-2 border border-white/20">Diff</th>
            <th className="p-2 border border-white/20">Punkte</th>
          </tr>
        </thead>
        <tbody>
          {sortierteTeams.map((team, i) => (
            <tr key={i} className="hover:bg-[#2c2f33]">
              <td className="p-2 border border-white/20">
                <img src={flagge(team.code)} alt={team.land} className="w-6 h-4 object-contain" />
              </td>
              <td className="p-2 border border-white/20">{team.land}</td>
              <td className="p-2 border border-white/20 text-center">{team.spiele}</td>
              <td className="p-2 border border-white/20 text-center">
                {team.tore}:{team.gegentore}
              </td>
              <td className="p-2 border border-white/20 text-center">
                {team.tore - team.gegentore}
              </td>
              <td className="p-2 border border-white/20 text-center">{team.punkte}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Spielplan */}
      <div className="mt-10">
        <h3 className="text-xl font-semibold mb-3">🗓️ Spielplan</h3>
        {[...new Set(spiele.map(s => s.spieltag))].map(st => (
          <div key={st} className="mb-6">
            <h4 className="text-lg font-semibold text-white mb-2">Spieltag {st}</h4>
            <table className="w-full border-collapse border border-white/20">
              <thead className="bg-[#202225]">
                <tr>
                  <th className="p-2 border border-white/20">Datum</th>
                  <th className="p-2 border border-white/20">Begegnung</th>
                </tr>
              </thead>
              <tbody>
                {spiele
                  .map((s, idx) => ({ ...s, idx }))
                  .filter(s => s.spieltag === st)
                  .map(s => (
                    <tr key={s.idx} className="hover:bg-[#2c2f33]">
                      <td className="p-2 border border-white/20">{s.datum}</td>
                      <td className="p-2 border border-white/20">
                        <div className="flex items-center justify-center gap-2">
                          <img src={flagge(s.heim)} className="w-5" alt={s.heim} />
                          <span>{landName(s.heim)}</span>
                          <input
                            type="number"
                            min="0"
                            value={s.homeGoals}
                            onChange={e => updateGoals(s.idx, "homeGoals", e.target.value)}
                            className="w-10 text-center bg-[#202225] border border-white/20 rounded"
                          />
                          <span className="text-xl">:</span>
                          <input
                            type="number"
                            min="0"
                            value={s.awayGoals}
                            onChange={e => updateGoals(s.idx, "awayGoals", e.target.value)}
                            className="w-10 text-center bg-[#202225] border border-white/20 rounded"
                          />
                          <span>{landName(s.auswärts)}</span>
                          <img src={flagge(s.auswärts)} className="w-5" alt={s.auswärts} />
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
export { initialSpiele }