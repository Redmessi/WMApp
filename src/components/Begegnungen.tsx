// src/components/Begegnungen.tsx
import { useContext, useMemo, useState } from "react";
import { ResultsContext, MatchResult } from "../contexts/ResultsContext";
import { initialData as teams } from "./Weltrangliste";

// Alle initialSpiele aus A–L importieren
import { initialSpiele as initialA } from "./GruppeA";
import { initialSpiele as initialB } from "./GruppeB";
import { initialSpiele as initialC } from "./GruppeC";
import { initialSpiele as initialD } from "./GruppeD";
import { initialSpiele as initialE } from "./GruppeE";
import { initialSpiele as initialF } from "./GruppeF";
import { initialSpiele as initialG } from "./GruppeG";
import { initialSpiele as initialH } from "./GruppeH";
import { initialSpiele as initialI } from "./GruppeI";
import { initialSpiele as initialJ } from "./GruppeJ";
import { initialSpiele as initialK } from "./GruppeK";
import { initialSpiele as initialL } from "./GruppeL";

type FlatMatch = MatchResult & { group: string };

// Mapping Code → ausgeschriebener Ländername
const countryMap: Record<string, string> = Object.fromEntries(
  teams.map(t => [t.code, t.land])
);

// Pfad zur Flagge
const flag = (code: string) => `/flags/${code.toLowerCase()}.svg`;

const initialByGroup: Record<string, MatchResult[]> = {
  A: initialA,
  B: initialB,
  C: initialC,
  D: initialD,
  E: initialE,
  F: initialF,
  G: initialG,
  H: initialH,
  I: initialI,
  J: initialJ,
  K: initialK,
  L: initialL,
};

export default function Begegnungen() {
  const { results } = useContext(ResultsContext);

  type SortKey = "datum" | "group" | "home" | "away" | "diff";
  const [sortKey, setSortKey] = useState<SortKey>("datum");
  const [asc, setAsc] = useState(true);

  // Alle Spiele flach aus allen Gruppen
  const flatMatches = useMemo<FlatMatch[]>(() =>
    Object.entries(initialByGroup).flatMap(([group, initial]) => {
      const res = results[group];
      return initial.map(m => {
        const updated = res?.find(r => r.heim === m.heim && r.auswärts === m.auswärts);
        return { ...(updated ?? m), group };
      });
    }),
  [results]);
  

  // Helfer zum Parsen von DD.MM.YYYY
  const parseDate = (d: string) => {
    const [day, mon, year] = d.split(".").map(Number);
    return new Date(year, mon - 1, day);
  };

  // Sortierung
  const sorted = useMemo(() => {
    const arr = [...flatMatches];
    arr.sort((a, b) => {
      switch (sortKey) {
        case "datum": {
          const da = parseDate(a.datum), db = parseDate(b.datum);
          return asc ? da.getTime() - db.getTime() : db.getTime() - da.getTime();
        }
        case "group":
          return asc
            ? a.group.localeCompare(b.group)
            : b.group.localeCompare(a.group);
        case "home":
          return asc
            ? countryMap[a.heim].localeCompare(countryMap[b.heim])
            : countryMap[b.heim].localeCompare(countryMap[a.heim]);
        case "away":
          return asc
            ? countryMap[a.auswärts].localeCompare(countryMap[b.auswärts])
            : countryMap[b.auswärts].localeCompare(countryMap[a.auswärts]);
        case "diff": {
          const da = Number(a.homeGoals) - Number(a.awayGoals);
          const db = Number(b.homeGoals) - Number(b.awayGoals);
          return asc ? da - db : db - da;
        }
      }
    });
    return arr;
  }, [flatMatches, sortKey, asc]);

  const toggle = (key: SortKey) => {
    if (key === sortKey) {
      setAsc(prev => !prev);
    } else {
      setSortKey(key);
      setAsc(true);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">🗓️ Alle Begegnungen</h2>
      <table className="w-full border-collapse text-left">
        <thead className="cursor-pointer bg-[#202225]">
          <tr>
            <th onClick={() => toggle("datum")} className="p-2 border-b">
              Datum {sortKey==="datum" ? (asc?"↑":"↓") : ""}
            </th>
            <th onClick={() => toggle("group")} className="p-2 border-b">
              Gruppe {sortKey==="group" ? (asc?"↑":"↓") : ""}
            </th>
            <th onClick={() => toggle("home")} className="p-2 border-b">
              Heim {sortKey==="home" ? (asc?"↑":"↓") : ""}
            </th>
            <th className="p-2 border-b">Ergebnis</th>
            <th onClick={() => toggle("away")} className="p-2 border-b">
              Auswärts {sortKey==="away" ? (asc?"↑":"↓") : ""}
            </th>
            <th onClick={() => toggle("diff")} className="p-2 border-b">
              Diff {sortKey==="diff" ? (asc?"↑":"↓") : ""}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((m, i) => {
            const goalsA = m.homeGoals, goalsB = m.awayGoals;
            const diff = Number(goalsA) - Number(goalsB);
            return (
              <tr key={i} className="hover:bg-[#2c2f33]">
                <td className="p-2">{m.datum}</td>
                <td className="p-2">{m.group}</td>

                {/* Heim mit Flagge */}
                <td className="p-2 flex items-center gap-1">
                  <img src={flag(m.heim)} alt={m.heim} className="w-5 h-3" />
                  <span>{countryMap[m.heim]}</span>
                </td>

                {/* Ergebnis */}
                <td className="p-2 text-center">
                  {goalsA !== "" && goalsB !== "" ? `${goalsA}:${goalsB}` : "-"}
                </td>

                {/* Auswärts mit Flagge */}
                <td className="p-2 flex items-center gap-1">
                  <img src={flag(m.auswärts)} alt={m.auswärts} className="w-5 h-3" />
                  <span>{countryMap[m.auswärts]}</span>
                </td>

                {/* Tordifferenz */}
                <td className="p-2 text-center">
                  {goalsA !== "" && goalsB !== "" ? diff : "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
