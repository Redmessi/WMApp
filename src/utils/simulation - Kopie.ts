// src/utils/simulation.ts

import { MatchResult } from "../contexts/ResultsContext";

export interface TeamInfo {
  code: string;
  rang: number;      // Weltranglistenplatz
  formScore: number; // Aktuelle Form als Wert (0–1)
}

export interface SimulationParams {
  runs: number;           // Anzahl der Monte-Carlo-Durchläufe
  weightRanking: number;  // Gewichtung Rang in [0,1]
  weightForm: number;     // Gewichtung Form in [0,1]
  drawChance: number;     // Wahrscheinlichkeit für Unentschieden (0–1)
}

export interface SimulationResult {
  [teamCode: string]: {
    // Häufigkeiten für Platz 1..N in Prozent
    placeProbabilities: number[];
  };
}

/**
 * Berechnet die Stärke eines Teams basierend auf Rang und Form.
 */
function calcStrength(team: TeamInfo, params: SimulationParams): number {
  const rankScore = 1 / team.rang;
  return params.weightRanking * rankScore + params.weightForm * team.formScore;
}

/**
 * Simuliert einen einzelnen Spielausgang zwischen Heim- und Auswärts-Team.
 */
function simulateMatch(
  home: TeamInfo,
  away: TeamInfo,
  params: SimulationParams
): [number, number] {
  const strengthHome = calcStrength(home, params);
  const strengthAway = calcStrength(away, params);
  const total = strengthHome + strengthAway;
  const pDraw = params.drawChance;
  const pHomeWin = (strengthHome / total) * (1 - pDraw);
  const rnd = Math.random();
  if (rnd < pHomeWin) return [3, 0];
  else if (rnd < pHomeWin + pDraw) return [1, 1];
  return [0, 3];
}

/**
 * Generiert einen Hin- und Rückspielplan (Double Round Robin) mit Dummy-Daten
 * für Spieltag, Datum und Tore, damit MatchResult erfüllt ist.
 */
export function generateDoubleRoundRobin(teamCodes: string[]): MatchResult[] {
  const matches: MatchResult[] = [];
  for (let i = 0; i < teamCodes.length; i++) {
    for (let j = i + 1; j < teamCodes.length; j++) {
      // Hinspiel
      matches.push({
        spieltag: 0,
        datum: "",
        heim: teamCodes[i],
        auswärts: teamCodes[j],
        homeGoals: "",
        awayGoals: ""
      });
      // Rückspiel
      matches.push({
        spieltag: 0,
        datum: "",
        heim: teamCodes[j],
        auswärts: teamCodes[i],
        homeGoals: "",
        awayGoals: ""
      });
    }
  }
  return matches;
}
export function simulateGroupWithPoints(
  groupMatches: MatchResult[],
  teamInfos: TeamInfo[],
  params: SimulationParams,
  initialPoints: Record<string, number> = {}
): Record<string, number[]> {
  const codes = teamInfos.map(t => t.code);
  const pointsHistory: Record<string, number[]> = {};
  codes.forEach(code => { pointsHistory[code] = []; });

  for (let run = 0; run < params.runs; run++) {
    const points: Record<string, number> = {};
    codes.forEach(c => { points[c] = initialPoints[c] ?? 0; });

    for (const m of groupMatches) {
      const home = teamInfos.find(t => t.code === m.heim)!;
      const away = teamInfos.find(t => t.code === m.auswärts)!;
      const [pH, pA] = simulateMatch(home, away, params);
      points[m.heim] += pH;
      points[m.auswärts] += pA;
    }

    codes.forEach(code => {
      pointsHistory[code].push(points[code]);
    });
  }

  return pointsHistory;
}

/**
 * Simuliert eine Gruppe über `runs` Monte-Carlo-Durchläufe.
 * Berücksichtigt optionale bereits erzielte Punkte (initialPoints).
 */
export function simulateGroup(
  groupMatches: MatchResult[],
  teamInfos: TeamInfo[],
  params: SimulationParams,
  initialPoints: Record<string, number> = {}
): SimulationResult {
  const codes = teamInfos.map(t => t.code);
  const placeCount = codes.length;
  const count: Record<string, number[]> = {};
  codes.forEach(code => { count[code] = Array(placeCount).fill(0); });

  for (let run = 0; run < params.runs; run++) {
    // Punkte mit initialPoints starten
    const points: Record<string, number> = {};
    codes.forEach(c => { points[c] = initialPoints[c] ?? 0; });

    // Verbleibende Spiele simulieren
    for (const m of groupMatches) {
      const home = teamInfos.find(t => t.code === m.heim)!;
      const away = teamInfos.find(t => t.code === m.auswärts)!;
      const [pH, pA] = simulateMatch(home, away, params);
      points[m.heim]   += pH;
      points[m.auswärts] += pA;
    }

    // Plätze ermitteln (Punkte, dann Zufall bei Gleichstand)
    const ranking = codes.slice().sort((a, b) => {
      const diff = points[b] - points[a];
      return diff !== 0 ? diff : Math.random() - 0.5;
    });

    // Platz-Häufigkeiten zählen
    ranking.forEach((code, idx) => {
      count[code][idx]++;
    });
  }

  // In Wahrscheinlichkeiten umwandeln
  const result: SimulationResult = {};
  codes.forEach(code => {
    result[code] = { placeProbabilities: count[code].map(c => (c / params.runs) * 100) };
  });

  return result;
}

/* Beispiel:
const allCodes = teamInfos.map(t => t.code);
const fullSchedule = generateDoubleRoundRobin(allCodes);
const played = [...]; // gefilterte MatchResults mit homeGoals/awayGoals
const remaining = fullSchedule.filter(m => !played.some(p => p.heim===m.heim && p.auswärts===m.auswärts));
const initPts = calculatePoints(played);
const stats = simulateGroup(remaining, teamInfos, params, initPts);
*/