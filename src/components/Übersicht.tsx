import { useContext, useMemo } from "react";
import { ResultsContext } from "../contexts/ResultsContext";
import { initialData as teams } from "./Weltrangliste";
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
import Plot from "react-plotly.js";
import eloData from "../assets/eloData.json";
const eloRatings: Record<string, number> = Object.fromEntries(
  eloData.map(team => [team.code, team.elo])
);


const gruppenSpiele = { A, B, C, D, E, F, G, H, I, J, K, L };
const flag = (code: string) => `/flags/${code.toLowerCase()}.svg`;
const countryName = (code: string) => teams.find(t => t.code === code)?.land || code;
const countryGroup = (code: string) => teams.find(t => t.code === code)?.gruppe || "";

// Helfer: Datum aus "DD.MM.YYYY" parsen
const parseDate = (d: string) => {
  const [day, month, year] = d.split(".").map(Number);
  return new Date(year, month - 1, day);
};

export default function Übersicht() {
  const { results } = useContext(ResultsContext);

  // Rang-Mapping
  const rangMap = useMemo(
    () => Object.fromEntries(teams.map(t => [t.code, t.rang])),
    []
  );

  // Alle Spiele
  const alleSpiele = useMemo(
    () => Object.entries(gruppenSpiele).flatMap(([gruppe, spiele]) => {
      const res = results[gruppe];
      return spiele.map(m => res?.find(r => r.heim === m.heim && r.auswärts === m.auswärts) || m);
    }),
    [results]
  );

  // Gespielte Spiele
  const gespielteSpiele = alleSpiele.filter(m => m.homeGoals !== "" && m.awayGoals !== "");

  // Underdog-Siege: Differenz >= 50, schlechteres Team siegt oder Remis
  const underdogSiege = useMemo(
    () => gespielteSpiele.filter(m => {
      const homeRank = rangMap[m.heim] ?? 300;
      const awayRank = rangMap[m.auswärts] ?? 300;
      const diff = Math.abs(homeRank - awayRank);
      if (diff < 50) return false;
      const homeGoals = Number(m.homeGoals);
      const awayGoals = Number(m.awayGoals);
      return (homeRank > awayRank && homeGoals >= awayGoals) || (awayRank > homeRank && awayGoals >= homeGoals);
    }),
    [gespielteSpiele, rangMap]
  );

  // Top 3 Spiele mit den meisten Toren
  const topToreSpiele = useMemo(
    () => [...gespielteSpiele]
      .sort((a, b) => (Number(b.homeGoals) + Number(b.awayGoals)) - (Number(a.homeGoals) + Number(a.awayGoals)))
      .slice(0, 3),
    [gespielteSpiele]
  );

  // Tore pro Team
  const toreProTeam = useMemo(() => {
    const tore: Record<string, number> = {};
    gespielteSpiele.forEach(m => {
      tore[m.heim] = (tore[m.heim] || 0) + Number(m.homeGoals);
      tore[m.auswärts] = (tore[m.auswärts] || 0) + Number(m.awayGoals);
    });
    return tore;
  }, [gespielteSpiele]);

  // Spitzenreiter nach Toren
  const topTeams = Object.entries(toreProTeam)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Form & Streak (letzte 3 Spiele)
  const teamForm = useMemo(() => {
    const map: Record<string, { results: string[]; streak: { type: string; count: number } }> = {};
    Object.keys(rangMap).forEach(code => {
      const spiele = gespielteSpiele
        .filter(m => m.heim === code || m.auswärts === code)
        .sort((a, b) => parseDate(b.datum).getTime() - parseDate(a.datum).getTime())
        .slice(0, 3);
      const resultsArr = spiele.map(m => {
        const gf = m.heim === code ? Number(m.homeGoals) : Number(m.awayGoals);
        const ga = m.heim === code ? Number(m.awayGoals) : Number(m.homeGoals);
        if (gf > ga) return 'W';
        if (gf === ga) return 'D';
        return 'L';
      });
      let type = resultsArr[0] === 'W' ? 'Siege' : resultsArr[0] === 'D' ? 'Unentschieden' : 'Niederlagen';
      let count = 0;
      for (const r of resultsArr) {
        if ((type === 'Siege' && r === 'W') || (type === 'Unentschieden' && r === 'D') || (type === 'Niederlagen' && r === 'L')) count++;
        else break;
      }
      map[code] = { results: resultsArr, streak: { type, count } };
    });
    return map;
  }, [gespielteSpiele, rangMap]);

  // Kommende Spiele (ab heute)
  const upcomingGames = useMemo(
    () => alleSpiele
      .filter(m => m.homeGoals === "" && parseDate(m.datum).getTime() >= Date.now())
      .sort((a, b) => parseDate(a.datum).getTime() - parseDate(b.datum).getTime())
      .slice(0, 5),
    [alleSpiele]
  );
// Elo-basierte Wahrscheinlichkeiten (aus FantasyMatch.tsx)
function getEloProbabilities(homeCode: string, awayCode: string) {
  const defaultElo = 1500;
  const eloHome = eloRatings[homeCode] ?? defaultElo;
  const eloAway = eloRatings[awayCode] ?? defaultElo;
  const expectedHomeWin = 1 / (1 + Math.pow(10, (eloAway - eloHome) / 400));
  const expectedAwayWin = 1 - expectedHomeWin;
  const drawProb = 0.20;                 // 20 % Remis wie in FantasyMatch
  const rest = 1 - drawProb;
  const probHome = Math.round(expectedHomeWin * rest * 100);
  const probDraw = Math.round(drawProb * 100);
  const probAway = 100 - probHome - probDraw;
  return { probHome, probDraw, probAway };
}


  // Wahrscheinlichkeiten basierend auf Weltrang
  // Elo-basierte Wahrscheinlichkeiten für kommende Spiele
const upcomingWithProb = useMemo(
  () =>
    upcomingGames.map(m => ({
      ...m,
      ...getEloProbabilities(m.heim, m.auswärts)
    })),
  [upcomingGames]
);


  const gesamtSpiele = alleSpiele.length;
  const gespielt = gespielteSpiele.length;
  const medals = ["🥇", "🥈", "🥉"];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Spiel-Fortschritt */}
      <div className="bg-[#2f3136] p-6 rounded-xl shadow-md">
        <h3 className="text-xl font-bold mb-2">Spiel-Fortschritt</h3>
        <div className="flex justify-center mb-4 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full" />
            <span>Gespielt</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full" />
            <span>Offen</span>
          </div>
        </div>
        <Plot
          data={[{ type: 'pie', values: [gespielt, gesamtSpiele - gespielt], labels: ['Gespielt', 'Offen'], hole: 0.5, domain: { x: [0, 0.5], y: [0, 1] }, marker: { colors: ['#00cc66', '#ff3333'] } }]}
          layout={{ autosize: false, paper_bgcolor: 'transparent', plot_bgcolor: 'transparent', height: 300, margin: { t: 20, b: 20, l: 20, r: 20 }, showlegend: false, font: { color: 'white' } }}
          config={{ responsive: true, displayModeBar: false }}
          style={{ width: '100%', height: '300px' }}
        />
      </div>

      {/* Top Teams */}
      <div className="bg-[#2f3136] p-6 rounded-xl shadow-md">
        <h3 className="text-xl font-bold mb-4">Top Teams (Tore)</h3>
        <ul className="space-y-2 text-left">
        {topTeams.map(([code, tore], idx) => (
  <li key={code} className="flex items-center gap-2">
    {idx < 3 && <span>{medals[idx]}</span>}
    <strong>{tore} Tore</strong>
    <span>{countryName(code)}</span>
    <img src={flag(code)} alt={code} className="w-6 h-4" />
    <span>(Gruppe {countryGroup(code)})</span>
  </li>
))}
      </ul>
      </div>

      {/* Torreiche Spiele */}
      <div className="bg-[#2f3136] p-6 rounded-xl shadow-md">
        <h3 className="text-xl font-bold mb-4">Torreiche Spiele</h3>
        <ul className="space-y-2">
          {topToreSpiele.map((m, idx) => {
            const total = Number(m.homeGoals) + Number(m.awayGoals);
          return (
              <li key={idx} className="flex items-center gap-4">
                ({parseDate(m.datum).toLocaleDateString('de-DE')})
                <img src={flag(m.heim)} alt={m.heim} className="w-6 h-4" />
                <span> {m.heim}</span>
                <span>{m.homeGoals} : {m.awayGoals}</span>
                <span>{m.auswärts}</span>
                <img src={flag(m.auswärts)} alt={m.auswärts} className="w-6 h-4" />
                <span>({total} Tore)</span>
           </li>
           );
          })}
        </ul>
      </div>
      {/* Underdog-Siege */}
      <div className="bg-[#2f3136] p-6 rounded-xl shadow-md">
        <h3 className="text-xl font-bold mb-4">Underdog-Siege</h3>
        <ul className="space-y-2">
          {underdogSiege.map((m, idx) => {
            const homeRank = rangMap[m.heim] ?? 300;
            const awayRank = rangMap[m.auswärts] ?? 300;
            const homeGoals = Number(m.homeGoals);
            const awayGoals = Number(m.awayGoals);
            const isDraw = homeGoals === awayGoals;
            const underdogHome = homeRank > awayRank;
            const classHome = underdogHome ? (isDraw ? 'text-orange-500 font-semibold' : homeGoals > awayGoals ? 'text-green-500 font-semibold' : '') : '';
            const classAway = !underdogHome ? (isDraw ? 'text-orange-500 font-semibold' : awayGoals > homeGoals ? 'text-green-500 font-semibold' : '') : '';
            return (
              <li key={idx} className="flex items-center gap-4">
                <img src={flag(m.heim)} alt={m.heim} className="w-6 h-4" />
                <span className={classHome}>{m.heim} ({homeRank})</span>
                <span>{m.homeGoals} : {m.awayGoals}</span>
                <span className={classAway}>{m.auswärts} ({awayRank})</span>
                <img src={flag(m.auswärts)} alt={m.auswärts} className="w-6 h-4" />
              </li>
            );
          })}
        </ul>
      </div>

      {/* Form & Streak */}
      <div className="bg-[#2f3136] p-6 rounded-xl shadow-md">
        <h3 className="text-xl font-bold mb-4">Form & Streak</h3>
        <ul className="space-y-2">
          {Object.entries(teamForm)
            .sort(([, a], [, b]) => b.streak.count - a.streak.count)
            .slice(0, 5)
            .map(([code, data]) => (
              <li key={code} className="flex items-center gap-3">
                <img src={flag(code)} alt={code} className="w-6 h-4" />
                <span>{countryName(code)}: [{data.results.join(', ')}]</span>
                <span className="font-semibold">{data.streak.count} {data.streak.type}</span>
              </li>
            ))}
        </ul>
      </div>

      {/* Kommende Spiele mit Elo-Wahrscheinlichkeiten */}
<div className="bg-[#2f3136] p-6 rounded-xl shadow-md lg:col-span-2">
  <h3 className="text-xl font-bold mb-4">Kommende Spiele</h3>
  <ul className="space-y-2">
    {upcomingWithProb.map((m, idx) => (
      <li key={idx} className="flex items-center gap-3">
        <span>{parseDate(m.datum).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}</span>
        <img src={flag(m.heim)} alt={m.heim} className="w-6 h-4" />
        <span>{m.heim}</span>
        <span>vs.</span>
        <span>{m.auswärts}</span>
        <img src={flag(m.auswärts)} alt={m.auswärts} className="w-6 h-4" />

        {/* Heimsieg-Prozent rechtsbündig */}
        <span className="ml-7 flex items-center gap-3 justify-end">
          <img src={flag(m.heim)} alt="Heimsieg" className="w-4 h-3" />
          <span className="text-right w-6">{m.probHome}%</span>
        </span>

        {/* Remis-Prozent rechtsbündig */}
        <span className="mx-2 text-right w-">🔸 {m.probDraw}%</span>

        {/* Auswärtssieg-Prozent rechtsbündig */}
        <span className="flex items-center gap-5 justify-end">
          <span className="text-right w-5">{m.probAway}%</span>
          <img src={flag(m.auswärts)} alt="Auswärtssieg" className="w-4 h-3" />
        </span>
      </li>
    ))}
  </ul>
</div>

    </div>
  );
}