// src/components/GruppeF.tsx
import { useContext, useEffect } from 'react';
import { ResultsContext, MatchResult } from "../contexts/ResultsContext";

const teamsData = [
  { code: 'POR', land: 'Portugal' },
  { code: 'HUN', land: 'Ungarn' },
  { code: 'IRL', land: 'Irland' },
  { code: 'ARM', land: 'Armenien' }
];

const initialSpiele: MatchResult[] = [
  { spieltag: 1, datum: '06.09.2025', heim: 'ARM', auswärts: 'POR', homeGoals: '', awayGoals: '' },
  { spieltag: 1, datum: '06.09.2025', heim: 'IRL', auswärts: 'HUN', homeGoals: '', awayGoals: '' },
  { spieltag: 2, datum: '09.09.2025', heim: 'ARM', auswärts: 'IRL', homeGoals: '', awayGoals: '' },
  { spieltag: 2, datum: '09.09.2025', heim: 'HUN', auswärts: 'POR', homeGoals: '', awayGoals: '' },
  { spieltag: 3, datum: '11.10.2025', heim: 'HUN', auswärts: 'ARM', homeGoals: '', awayGoals: '' },
  { spieltag: 3, datum: '11.10.2025', heim: 'POR', auswärts: 'IRL', homeGoals: '', awayGoals: '' },
  { spieltag: 4, datum: '14.10.2025', heim: 'IRL', auswärts: 'ARM', homeGoals: '', awayGoals: '' },
  { spieltag: 4, datum: '14.10.2025', heim: 'POR', auswärts: 'HUN', homeGoals: '', awayGoals: '' },
  { spieltag: 5, datum: '13.11.2025', heim: 'ARM', auswärts: 'HUN', homeGoals: '', awayGoals: '' },
  { spieltag: 5, datum: '13.11.2025', heim: 'IRL', auswärts: 'POR', homeGoals: '', awayGoals: '' },
  { spieltag: 6, datum: '16.11.2025', heim: 'HUN', auswärts: 'IRL', homeGoals: '', awayGoals: '' },
  { spieltag: 6, datum: '16.11.2025', heim: 'POR', auswärts: 'ARM', homeGoals: '', awayGoals: '' }
];

const flagge = (code: string) => `/flags/${code.toLowerCase()}.svg`;
const landName = (code: string) => teamsData.find(t => t.code === code)?.land || code;

export default function GruppeF() {
  const { results, setResults } = useContext(ResultsContext);

  useEffect(() => {
    if (!results["F"]) {
      setResults(r => ({ ...r, F: initialSpiele }));
    }
  }, [results, setResults]);

  const spiele = results["F"] ?? initialSpiele;

  const updateGoals = (idx: number, field: 'homeGoals' | 'awayGoals', value: string) => {
    setResults(r => {
      const group = [...(r["F"] ?? initialSpiele)];
      group[idx] = { ...group[idx], [field]: value === '' ? '' : parseInt(value, 10) };
      return { ...r, F: group };
    });
  };

  const teams = teamsData.map(team => {
    const spieleDesTeams = spiele.filter(s => (s.heim === team.code || s.auswärts === team.code) && s.homeGoals !== '' && s.awayGoals !== '');

    let tore = 0, gegentore = 0, punkte = 0;
    spieleDesTeams.forEach(s => {
      const th = Number(s.homeGoals), ta = Number(s.awayGoals);
      if (s.heim === team.code) {
        tore += th; gegentore += ta; punkte += th > ta ? 3 : th === ta ? 1 : 0;
      } else {
        tore += ta; gegentore += th; punkte += ta > th ? 3 : ta === th ? 1 : 0;
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
      <h2 className="text-2xl font-bold">🌍 WM-Quali 2026 – Gruppe F</h2>

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
              <td className="p-2 border border-white/20 text-center">{team.tore}:{team.gegentore}</td>
              <td className="p-2 border border-white/20 text-center">{team.tore - team.gegentore}</td>
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