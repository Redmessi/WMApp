// Datei: Statistik.tsx (Elo-optimierte Version)
import { useState, useContext, useEffect } from "react";
import Plot from "react-plotly.js";
import { Layout as PlotlyLayout } from "plotly.js";
import { ResultsContext, MatchResult } from "../contexts/ResultsContext";
import { initialSpiele as initialSpieleA } from "./GruppeA";
import { initialSpiele as initialSpieleB } from "./GruppeB";
import { initialSpiele as initialSpieleC } from "./GruppeC";
import { initialSpiele as initialSpieleD } from "./GruppeD";
import { initialSpiele as initialSpieleE } from "./GruppeE";
import { initialSpiele as initialSpieleF } from "./GruppeF";
import { initialSpiele as initialSpieleG } from "./GruppeG";
import { initialSpiele as initialSpieleH } from "./GruppeH";
import { initialSpiele as initialSpieleI } from "./GruppeI";
import { initialSpiele as initialSpieleJ } from "./GruppeJ";
import { initialSpiele as initialSpieleK } from "./GruppeK";
import { initialSpiele as initialSpieleL } from "./GruppeL";
import html2canvas from "html2canvas";
import eloData from "../assets/eloData.json";

const eloRatings: Record<string, number> = Object.fromEntries(
  eloData.map(team => [team.code, team.elo])
);

const gruppenSpiele: Record<string, MatchResult[]> = {
  A: initialSpieleA, B: initialSpieleB, C: initialSpieleC, D: initialSpieleD,
  E: initialSpieleE, F: initialSpieleF, G: initialSpieleG, H: initialSpieleH,
  I: initialSpieleI, J: initialSpieleJ, K: initialSpieleK, L: initialSpieleL
};

export default function Statistik() {
  const { results } = useContext(ResultsContext);
  const gruppenNamen = Object.keys(gruppenSpiele);
  const [selectedGroup, setSelectedGroup] = useState<string>(gruppenNamen[0] || "");
  const [spiele, setSpiele] = useState<MatchResult[]>([]);
  const [simulatedAllPoints, setSimulatedAllPoints] = useState<{ [team: string]: number[] }>({});
  const [simulatedPoints, setSimulatedPoints] = useState<{ [team: string]: number }>({});
  const [simulatedData, setSimulatedData] = useState<{ [team: string]: number[] }>({});

  useEffect(() => {
    const aktuelleSpiele = results[selectedGroup] ?? gruppenSpiele[selectedGroup] ?? [];
    setSpiele(aktuelleSpiele);
  }, [results, selectedGroup]);

  const teamCodes = Array.from(new Set(spiele.flatMap(match => [match.heim, match.auswärts])));

  function exportTableAsImage() {
    const tableContainer = document.getElementById("table-container");
    if (tableContainer) {
      html2canvas(tableContainer, {
        backgroundColor: "#36393f",
        scale: 2,
        useCORS: true
      }).then(canvas => {
        const link = document.createElement("a");
        const date = new Date().toISOString().slice(0, 10);
        link.download = `Gruppe_${selectedGroup}_${date}.png`;
        link.href = canvas.toDataURL();
        link.click();
      });
    }
  }

  function simulateGameWithElo(home: string, away: string): 'home' | 'away' | 'draw' {
    const defaultElo = 1500;
    const eloHome = eloRatings[home] ?? defaultElo;
    const eloAway = eloRatings[away] ?? defaultElo;

    const expectedHomeWin = 1 / (1 + Math.pow(10, (eloAway - eloHome) / 400));
    const expectedAwayWin = 1 - expectedHomeWin;

    const drawFactor = (Number(localStorage.getItem("u")) || 10) / 100;
    const drawProb = drawFactor * Math.exp(-Math.abs(eloHome - eloAway) / 400);
    const norm = expectedHomeWin + expectedAwayWin + drawProb;

    const pHome = expectedHomeWin / norm;
    const pAway = expectedAwayWin / norm;
    const pDraw = drawProb / norm;

    const r = Math.random();
    if (r < pHome) return 'home';
    else if (r < pHome + pDraw) return 'draw';
    else return 'away';
  }

  function simulateGroup() {
    const points: { [team: string]: number } = {};
    teamCodes.forEach(code => points[code] = 0);
    spiele.forEach((match: MatchResult) => {
      if (match.homeGoals !== "" && match.awayGoals !== "") {
        const th = Number(match.homeGoals);
        const ta = Number(match.awayGoals);
        if (th > ta) points[match.heim] += 3;
        else if (th < ta) points[match.auswärts] += 3;
        else {
          points[match.heim] += 1;
          points[match.auswärts] += 1;
        }
      } else {
        const result = simulateGameWithElo(match.heim, match.auswärts);
        if (result === 'home') points[match.heim] += 3;
        else if (result === 'away') points[match.auswärts] += 3;
        else {
          points[match.heim] += 1;
          points[match.auswärts] += 1;
        }
      }
    });
    return points;
  }

  function runSimulations() {
    if (spiele.length === 0) return;
    const monteCarloRuns = Number(localStorage.getItem("mc")) || 500;
    const tempResults: { [team: string]: number[] } = {};
    const tempAllPoints: { [team: string]: number[] } = {};
    const tempPoints: { [team: string]: number } = {};
    teamCodes.forEach(code => {
      tempResults[code] = new Array(teamCodes.length).fill(0);
      tempAllPoints[code] = [];
      tempPoints[code] = 0;
    });
    for (let i = 0; i < monteCarloRuns; i++) {
      const points = simulateGroup();
      const ranking = teamCodes.map(code => ({ code, points: points[code] }))
                               .sort((a, b) => b.points - a.points);
      ranking.forEach((team, index) => {
        tempResults[team.code][index] += 1;
        tempPoints[team.code] += team.points;
      });
      teamCodes.forEach(code => {
        tempAllPoints[code].push(points[code]);
      });
    }
    setSimulatedData(tempResults);
    setSimulatedPoints(tempPoints);
    setSimulatedAllPoints(tempAllPoints);
  }

  function handleGroupChange(group: string) {
    setSelectedGroup(group);
    setSimulatedData({});
    setSimulatedPoints({});
    setSimulatedAllPoints({});
  }

  function getBackgroundColor(percent: number) {
    const green = { r: 104, g: 250, b: 111 };
    const orange = { r: 244, g: 177, b: 42 };
    const red = { r: 245, g: 104, b: 89 };
    let color;
    if (percent >= 95) {
      color = green;
    } else if (percent >= 50) {
      const ratio = (percent - 50) / 45;
      color = {
        r: Math.round(orange.r + (green.r - orange.r) * ratio),
        g: Math.round(orange.g + (green.g - orange.g) * ratio),
        b: Math.round(orange.b + (green.b - orange.b) * ratio),
      };
    } else {
      const ratio = percent / 50;
      color = {
        r: Math.round(red.r + (orange.r - red.r) * ratio),
        g: Math.round(red.g + (orange.g - red.g) * ratio),
        b: Math.round(red.b + (orange.b - red.b) * ratio),
      };
    }
    const brightness = (color.r * 299 + color.g * 587 + color.b * 114) / 1000;
    const textColor = brightness > 150 ? "#000000" : "#FFFFFF";
    return {
      backgroundColor: `rgb(${color.r}, ${color.g}, ${color.b})`,
      color: textColor
    };
  }

  const monteCarloRuns = Number(localStorage.getItem("mc")) || 500;
  const sortedTeams = Object.keys(simulatedPoints).sort((a, b) => (simulatedPoints[b] / monteCarloRuns) - (simulatedPoints[a] / monteCarloRuns));
  const maxPoints = teamCodes.length === 4 ? 18 : 24;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Statistik (Elo + Simulation)</h2>
      <div className="mb-4">
        <label className="mr-2">Gruppe auswählen:</label>
        <select
          value={selectedGroup}
          onChange={e => handleGroupChange(e.target.value)}
          className="text-black p-2 rounded"
        >
          {gruppenNamen.map(group => (
            <option key={group} value={group}>{`Gruppe ${group}`}</option>
          ))}
        </select>
      </div>
      <button
        onClick={runSimulations}
        disabled={!teamCodes.length}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-8"
      >
        Simulation starten
      </button>
      <button
        onClick={exportTableAsImage}
        className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-8 ml-2"
      >
        Tabelle speichern
      </button>
      {Object.keys(simulatedData).length > 0 && (
        <div className="mb-8">
          <div id="table-container">
            <table className="table-auto mb-8" style={{ maxWidth: "800px" }}>
              <thead>
                <tr>
                  <th className="px-1 py-2">Team</th>
                  {teamCodes.map((_, idx) => (
                    <th key={idx} className="px-1 py-2">{idx + 1}. Platz %</th>
                  ))}
                  <th className="px-1 py-2">Ø Punkte</th>
                </tr>
              </thead>
              <tbody>
                {sortedTeams.map(team => (
                  <tr key={team}>
                    <td className="border px-4 py-2">{team}</td>
                    {simulatedData[team]?.map((count, idx) => {
                      const percent = (count / monteCarloRuns) * 100;
                      return (
                        <td
                          key={idx}
                          className="border px-4 py-2"
                          style={getBackgroundColor(percent)}
                        >
                          {percent.toFixed(1)}%
                        </td>
                      );
                    })}
                    <td className="border px-4 py-2">{Math.round(simulatedPoints[team] / monteCarloRuns)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Plot
            data={sortedTeams.map(team => ({
              type: 'box',
              y: simulatedAllPoints[team],
              name: team,
              boxpoints: false,
              line: { width: 2 }
            }))}
            layout={{
              title: 'Punkteverteilung pro Team (Simulation)',
              yaxis: { title: 'Punkte', range: [0, maxPoints], zeroline: false, dtick: 1 },
              xaxis: {
                tickmode: "array",
                tickvals: sortedTeams,
                ticktext: sortedTeams,
                automargin: true,
                tickangle: -30,
                tickfont: { size: 12 },
                domain: [0.1, 0.9],
                categorygap: 0.4
              },
              boxmode: 'group',
              boxgap: 0.1,
              boxgroupgap: 0.1,
              height: 500,
              width: 500,
              autosize: false,
              margin: { t: 50, b: 100, l: 80, r: 80 },
              transition: { duration: 500, easing: 'cubic-in-out' }
            } as Partial<PlotlyLayout>}
            style={{ width: '100%', height: 'auto' }}
            config={{ responsive: true }}
          />
        </div>
      )}
    </div>
  );
}