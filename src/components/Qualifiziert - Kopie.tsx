// src/components/Qualifiziert.tsx
import { useContext, useMemo, useState } from "react";
import { ResultsContext, MatchResult } from "../contexts/ResultsContext";
import { initialData as rawInitialData } from "./Weltrangliste";
import { initialSpiele as A } from "./GruppeA";
import { initialSpiele as B } from "./GruppeB";
import { initialSpiele as C } from "./GruppeC";
import { initialSpiele as D } from "./GruppeD";
import { initialSpiele as E } from "./GruppeE";
import { initialSpiele as F } from "./GruppeF";
import { initialSpiele as G } from "./GruppeG";
import { initialSpiele as H } from "./GruppeH";
import { initialSpiele as I } from "./GruppeI";
import { initialSpiele as J } from "./GruppeJ";
import { initialSpiele as K } from "./GruppeK";
import { initialSpiele as L } from "./GruppeL";

const gruppenSpiele: Record<string, MatchResult[]> = { A, B, C, D, E, F, G, H, I, J, K, L };
const flagge = (code: string) => `/flags/${code.toLowerCase()}.svg`;
const initialData = rawInitialData.filter(t => t.gruppe !== "X");

const teamRankings: Record<string, number> = Object.fromEntries(initialData.map(team => [team.code, team.rang]));

export default function Qualifiziert() {
  const { results } = useContext(ResultsContext);
  const [simKey, setSimKey] = useState(0);
  const [realKey, setRealKey] = useState(0);

  function simulateGoals(homeStrength: number, awayStrength: number) {
    const homeMean = 1.5 * homeStrength;
    const awayMean = 1.2 * awayStrength;
    const homeGoals = Math.max(0, Math.round(homeMean + (Math.random() - 0.5)));
    const awayGoals = Math.max(0, Math.round(awayMean + (Math.random() - 0.5)));
    return [homeGoals, awayGoals];
  }

  function simulateGame(home: string, away: string) {
    const maxRank = 240;
    const rankHome = teamRankings[home] || maxRank;
    const rankAway = teamRankings[away] || maxRank;
    const normalizedHome = (maxRank - rankHome) / maxRank;
    const normalizedAway = (maxRank - rankAway) / maxRank;
    const strengthHome = Math.pow(normalizedHome, 2.5);
    const strengthAway = Math.pow(normalizedAway, 2.5);
    const drawChance = (Number(localStorage.getItem("u")) || 10) / 100;
    const pHome = (strengthHome / (strengthHome + strengthAway)) * (1 - drawChance);
    const r = Math.random();
    if (r < pHome) return [1, 0];
    else if (r < pHome + drawChance) return [0, 0];
    else return [0, 1];
  }

  const getMatches = (gruppe: string) => {
    const res = results[gruppe];
    const initial = gruppenSpiele[gruppe];
    if (!res) return initial;

    return initial.map(match => {
      const updated = res.find(r => r.heim === match.heim && r.auswärts === match.auswärts);
      return updated ? updated : match;
    });
  };

  const realTeams = useMemo(() => {
    const teams = initialData.map(team => {
      const spiele = getMatches(team.gruppe) || [];
      let tore = 0, gegentore = 0, punkte = 0;
      spiele.forEach(s => {
        if (s.homeGoals !== "" && s.awayGoals !== "") {
          const th = Number(s.homeGoals);
          const ta = Number(s.awayGoals);
          if (s.heim === team.code) {
            tore += th; gegentore += ta;
            punkte += th > ta ? 3 : th === ta ? 1 : 0;
          } else if (s.auswärts === team.code) {
            tore += ta; gegentore += th;
            punkte += ta > th ? 3 : ta === th ? 1 : 0;
          }
        }
      });
      return { ...team, spiele: spiele.length, tore, gegentore, diff: tore - gegentore, punkte };
    });

    const byGroup: Record<string, typeof teams> = {};
    teams.forEach(t => {
      if (!byGroup[t.gruppe]) byGroup[t.gruppe] = [];
      byGroup[t.gruppe].push(t);
    });

    const allRanked: { team: typeof teams[0]; platz: number }[] = [];
    Object.values(byGroup).forEach(grp => {
      grp.sort((a, b) => {
        if (b.punkte !== a.punkte) return b.punkte - a.punkte;
        if (b.diff !== a.diff) return b.diff - a.diff;
        return b.tore - a.tore;
      }).forEach((team, idx) => {
        allRanked.push({ team, platz: idx + 1 });
      });
    });

    return allRanked.sort((a, b) => {
      if (a.platz !== b.platz) return a.platz - b.platz;
      if (b.team.punkte !== a.team.punkte) return b.team.punkte - a.team.punkte;
      if (b.team.diff !== a.team.diff) return b.team.diff - a.team.diff;
      return b.team.tore - a.team.tore;
    });
  }, [results, realKey]);
  const simulatedTeams = useMemo(() => {
    const spiele = Object.entries(gruppenSpiele).flatMap(([gruppe]) => getMatches(gruppe))
      .filter(m => m.heim !== "RUS" && m.auswärts !== "RUS");

    const groupRanks: Record<string, { team: typeof initialData[0]; avgPunkte: number }[]> = {};

    const monteCarloRuns = Number(localStorage.getItem("mc")) || 500;
    for (let i = 0; i < monteCarloRuns; i++) {
      const tempPoints: { [code: string]: number } = {};
      initialData.forEach(t => tempPoints[t.code] = 0);
      spiele.forEach(m => {
        if (m.homeGoals !== "" && m.awayGoals !== "") {
          const th = Number(m.homeGoals);
          const ta = Number(m.awayGoals);
          if (th > ta) tempPoints[m.heim] += 3;
          else if (th < ta) tempPoints[m.auswärts] += 3;
          else {
            tempPoints[m.heim] += 1;
            tempPoints[m.auswärts] += 1;
          }
        } else {
          const [homeGoals, awayGoals] = simulateGame(m.heim, m.auswärts);
          if (homeGoals > awayGoals) tempPoints[m.heim] += 3;
          else if (homeGoals < awayGoals) tempPoints[m.auswärts] += 3;
          else {
            tempPoints[m.heim] += 1;
            tempPoints[m.auswärts] += 1;
          }
        }
      });

      initialData.forEach(t => {
        if (!groupRanks[t.gruppe]) groupRanks[t.gruppe] = [];
        const existing = groupRanks[t.gruppe].find(e => e.team.code === t.code);
        if (!existing) groupRanks[t.gruppe].push({ team: t, avgPunkte: tempPoints[t.code] });
        else existing.avgPunkte += tempPoints[t.code];
      });
    }

    Object.values(groupRanks).forEach(teams => {
      teams.forEach(t => t.avgPunkte = Math.round(t.avgPunkte / monteCarloRuns));
      teams.sort((a, b) => b.avgPunkte - a.avgPunkte);
    });

    const ordered: { team: typeof initialData[0]; avgPunkte: number; platz: number }[] = [];
    Object.values(groupRanks).forEach(teams => {
      teams.forEach((t, idx) => {
        ordered.push({ team: t.team, avgPunkte: t.avgPunkte, platz: idx + 1 });
      });
    });

    return ordered.sort((a, b) => a.platz - b.platz || a.team.gruppe.localeCompare(b.team.gruppe));
  }, [results, simKey]);

  const getRowColor = (index: number) => {
    if (index < 12) return "bg-green-700";
    if (index < 16) return "bg-orange-600";
    return "bg-red-700";
  };

  return (
    <div className="max-w-7xl mx-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setRealKey(prev => prev + 1)}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Tabelle aktualisieren
          </button>
          <button
            onClick={() => setSimKey(prev => prev + 1)}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Neue Simulation starten
          </button>
        </div>
        <h2 className="text-2xl font-bold mb-6">🌍 Aktueller Stand (Real)</h2>
        <table className="w-full border-collapse text-left">
          <thead className="bg-[#202225]">
            <tr>
              <th className="p-2 border-b">#</th>
              <th className="p-2 border-b">Flagge</th>
              <th className="p-2 border-b">Team</th>
              <th className="p-2 border-b">Gruppe</th>
              <th className="p-2 border-b">Spiele</th>
              <th className="p-2 border-b">Tore</th>
              <th className="p-2 border-b">Diff</th>
              <th className="p-2 border-b">Punkte</th>
            </tr>
          </thead>
          <tbody>
            {realTeams.map((t, idx) => (
              <tr key={t.team.code} className={`hover:bg-[#2c2f33] ${getRowColor(idx)}`}>
                <td className="p-2">{idx + 1}</td>
                <td className="p-2">
                  <img src={flagge(t.team.code)} alt={t.team.code} className="w-6 h-4" />
                </td>
                <td className="p-2">{t.team.land}</td>
                <td className="p-2">{t.team.gruppe}</td>
                <td className="p-2 text-center">{t.team.spiele}</td>
                <td className="p-2 text-center">{t.team.tore}:{t.team.gegentore}</td>
                <td className="p-2 text-center">{t.team.diff}</td>
                <td className="p-2 text-center">{t.team.punkte}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6">🔬 Prognose (Simulation)</h2>
        <table className="w-full border-collapse text-left">
          <thead className="bg-[#202225]">
            <tr>
              <th className="p-2 border-b">#</th>
              <th className="p-2 border-b">Flagge</th>
              <th className="p-2 border-b">Team</th>
              <th className="p-2 border-b">Gruppe</th>
              <th className="p-2 border-b">Gruppenplatz</th>
              <th className="p-2 border-b">Ø Punkte</th>
            </tr>
          </thead>
          <tbody>
            {simulatedTeams.map((t, idx) => (
              <tr key={t.team.code} className={`hover:bg-[#2c2f33] ${getRowColor(idx)}`}>
                <td className="p-2">{idx + 1}</td>
                <td className="p-2">
                  <img src={flagge(t.team.code)} alt={t.team.code} className="w-6 h-4" />
                </td>
                <td className="p-2">{t.team.land}</td>
                <td className="p-2">{t.team.gruppe}</td>
                <td className="p-2 text-center">{t.platz}.</td>
                <td className="p-2 text-center">{t.avgPunkte}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}