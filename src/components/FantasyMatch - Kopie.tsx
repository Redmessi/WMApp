import { useState, useEffect, useRef } from "react";
import { initialData as teams } from "./Weltrangliste";
import Plot from "react-plotly.js";
import html2canvas from "html2canvas";
import eloData from "../assets/eloData.json";

const eloRatings: Record<string, number> = Object.fromEntries(
  eloData.map(team => [team.code, team.elo])
);


const teamRankings = Object.fromEntries(teams.map(t => [t.code, t.rang]));

function getFlagUrl(code: string) {
  return `/flags/${code.toLowerCase()}.svg`;
}

export default function FantasyMatch() {
  const [homeTeam, setHomeTeam] = useState("GER");
  const [awayTeam, setAwayTeam] = useState("FRA");
  const [resultMatrix, setResultMatrix] = useState<number[][]>([]);
  const [topResults, setTopResults] = useState<{ score: string; percentage: number }[]>([]);
  const [highlightCoords, setHighlightCoords] = useState<[number, number]>([0, 0]);
  const [maxPercentage, setMaxPercentage] = useState(0);
  const [minPercentage, setMinPercentage] = useState(0);
  const [outcomeCounts, setOutcomeCounts] = useState({ home: 0, draw: 0, away: 0 });

  const [bonusGoalsEnabled, setBonusGoalsEnabled] = useState(true);

  const plotRef = useRef<HTMLDivElement>(null);
  const chartAreaRef = useRef<HTMLDivElement>(null);

  const maxGoals = 9;
  const bonusFactor = 0.03;
  const [goalDistribution, setGoalDistribution] = useState<{
    home: number[];
    away: number[];
  }>({ home: Array(maxGoals).fill(0), away: Array(maxGoals).fill(0) });
  

  function poissonSample(lambda: number) {
    let L = Math.exp(-lambda);
    let k = 0;
    let p = 1;
    do {
      k++;
      p *= Math.random();
    } while (p > L);
    return k - 1;
  }

  function simulateGoalsElo(homeCode: string, awayCode: string) {
    const defaultElo = 1500;
    const eloHome = eloRatings[homeCode] ?? defaultElo;
    const eloAway = eloRatings[awayCode] ?? defaultElo;
  
    const expectedHomeWin = 1 / (1 + Math.pow(10, (eloAway - eloHome) / 400));
    const expectedAwayWin = 1 - expectedHomeWin;
  
    // Tor-Basis relativ niedrig ansetzen (z.B. 1,5 bis 3 Tore typischerweise)
    const baseGoals = 1.2;
    const scalingFactor = 2.0; // Steuert, wie stark die Tore wachsen
  
    let expectedHomeGoals = baseGoals + scalingFactor * expectedHomeWin;
    let expectedAwayGoals = baseGoals + scalingFactor * expectedAwayWin;
  
    // Optionale zusätzliche Dämpfung bei extremen Elo-Differenzen
    const eloDiff = Math.abs(eloHome - eloAway);
    const dampingFactor = 0.8+0.2*(1/(1 + eloDiff / 600)); // z.B. bei 600 Punkten halbe Wirkung
  
    expectedHomeGoals *= dampingFactor;
    expectedAwayGoals *= dampingFactor;
  
    // Poisson-Simulation
    const homeGoals = poissonSample(expectedHomeGoals);
    const awayGoals = poissonSample(expectedAwayGoals);
  
    return [homeGoals, awayGoals];
  }
  

  function runSimulation() {
    const simulations = Number(localStorage.getItem("mc")) || 10000;
    const matrix = Array.from({ length: maxGoals }, () => Array(maxGoals).fill(0));
    const maxRank = 240;
    const rankHome = teamRankings[homeTeam] || maxRank;
    const rankAway = teamRankings[awayTeam] || maxRank;

    const scoreCounts: Record<string, number> = {};
    let homeWins = 0;
    let awayWins = 0;
    let draws = 0;
    let homeGoalsCount = Array(maxGoals).fill(0);
let awayGoalsCount = Array(maxGoals).fill(0);

    const drawChance = (Number(localStorage.getItem("u")) || 10) / 100;
    for (let i = 0; i < simulations; i++) {


      const [hg, ag] = simulateGoalsElo(homeTeam, awayTeam);
      if (hg < maxGoals) homeGoalsCount[hg]++;
      if (ag < maxGoals) awayGoalsCount[ag]++;
      

      if (hg >= maxGoals || ag >= maxGoals) {
        continue;
      }

      if (Math.random() < drawChance) {
        const g = Math.min(hg, ag);
        matrix[g][g]++;
        draws++;
      } else {
        matrix[hg][ag]++;
        if (hg > ag) homeWins++;
        else if (hg < ag) awayWins++;
        else draws++;
      }
      

      const key = `${hg}:${ag}`;
      scoreCounts[key] = (scoreCounts[key] || 0) + 1;
    }

    const percentageMatrix = matrix.map(row => row.map(val => +(val / simulations * 100).toFixed(1)));
    setResultMatrix(percentageMatrix);

    let flatValues = percentageMatrix.flat();
    setMaxPercentage(Math.max(...flatValues));
    setMinPercentage(Math.min(...flatValues));

    const sortedResults = Object.entries(scoreCounts)
      .map(([key, count]) => ({ score: key, percentage: (count / simulations) * 100 }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 3);

    setTopResults(sortedResults);
    setOutcomeCounts({ home: homeWins, draw: draws, away: awayWins });
    setGoalDistribution({ home: homeGoalsCount, away: awayGoalsCount });


    if (sortedResults.length > 0) {
      const [h, a] = sortedResults[0].score.split(":" ).map(Number);
      setHighlightCoords([h, a]);
    }
  }

  useEffect(() => {
    runSimulation();
  }, [homeTeam, awayTeam, bonusGoalsEnabled]);

  function getTodayString() {
    const today = new Date();
    return `${today.getDate().toString().padStart(2, "0")}-${(today.getMonth()+1).toString().padStart(2, "0")}-${today.getFullYear()}`;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-6 items-center">
        <div>
          <label className="block mb-2">Heimteam auswählen:</label>
          <select
            value={homeTeam}
            onChange={e => setHomeTeam(e.target.value)}
            className="bg-[#2f3136] text-white p-2 rounded"
          >
            {teams.map(team => (
              <option key={team.code} value={team.code}>{team.land}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-2">Auswärtsteam auswählen:</label>
          <select
            value={awayTeam}
            onChange={e => setAwayTeam(e.target.value)}
            className="bg-[#2f3136] text-white p-2 rounded"
          >
            {teams.map(team => (
              <option key={team.code} value={team.code}>{team.land}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={bonusGoalsEnabled}
            onChange={e => setBonusGoalsEnabled(e.target.checked)}
          />
          <label>Bonus-Tore aktivieren</label>
        </div>

        <button
          onClick={runSimulation}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          🔄 Neue Simulation
        </button>
      </div>
//Hier ist das Tortendigramm
      <div ref={chartAreaRef}>
        {resultMatrix.length > 0 && (
          <div ref={plotRef} className="relative p-4 bg-[#36393f] rounded">
            <div style={{position: "absolute", top: 0,bottom:100, right: 10, left: 150, zIndex:10, fontSize: "28px", fontWeight: "bold", marginBottom: "8px" }}>
              {teams.find(t => t.code === homeTeam)?.land} vs {teams.find(t => t.code === awayTeam)?.land}
            </div>
            <div className="mt-10 bg-[#36393f] p-4 rounded">
  <h3 className="text-center text-white font-bold text-lg mb-4">Sieg / Remis / Niederlage</h3>
  <Plot 
    data={[{
      values: [outcomeCounts.home, outcomeCounts.draw, outcomeCounts.away],
      labels: [
        `${teams.find(t => t.code === homeTeam)?.land} gewinnt`,
        "Unentschieden",
        `${teams.find(t => t.code === awayTeam)?.land} gewinnt`
      ],
      type: 'pie',
      marker: {
        colors: ["#2ecc71", "#f1c40f", "#e74c3c"]
      },
      textinfo: "label+percent",
      hole: 0.3
    }]}
    layout={{
      height: 400,
      width: 500,
      paper_bgcolor: "#36393f",
      font: { color: "white", size: 14 },
      margin: { t: 30, b: 30, l: 30, r: 30 }
    }}
    config={{ responsive: true }}
  />
</div>
 
<div className="mt-10 bg-[#36393f] p-4 rounded">
  <h3 className="text-center text-white font-bold text-lg mb-4">Torverteilung</h3>
  <Plot // Hier ist das Tordiagramm
    data={[
      {
        x: Array.from({ length: maxGoals }, (_, i) => i),
        y: goalDistribution.home,
        name: `${teams.find(t => t.code === homeTeam)?.land}`,
        type: 'bar',
        marker: { color: '#3498db' }
      },
      {
        x: Array.from({ length: maxGoals }, (_, i) => i),
        y: goalDistribution.away,
        name: `${teams.find(t => t.code === awayTeam)?.land}`,
        type: 'bar',
        marker: { color: '#e67e22' }
      }
    ]}
    layout={{
      barmode: 'group',
      height: 400,
      width: 600,
      xaxis: {
        title: 'Tore',
        tickmode: 'linear',
        dtick: 1
      },
      yaxis: {
        title: 'Anzahl der Simulationen',
        rangemode: 'tozero'
      },
      paper_bgcolor: "#36393f",
      plot_bgcolor: "#36393f",
      font: { color: "white" }
    }}
    config={{ responsive: true }}
  />
</div>



            <div className="absolute flex flex-col items-center z-50" style={{ top: '1340px', left: '-45px', transform: 'rotate(-90deg)' }}>
  <button className="background-color: rgb(55 65 81); text-white h-[40px] w-[120px] flex items-center justify-center text-center rounded cursor-default">
    {teams.find(t => t.code === homeTeam)?.land}
  </button>
</div>

<div className="absolute flex items-center z-50" style={{ top: '1650px', left: '300px' }}>
  <button className="background-color: rgb(55 65 81); text-white h-[40px] w-[120px] flex items-center justify-center text-center rounded cursor-default">
    {teams.find(t => t.code === awayTeam)?.land}
  </button>
</div>

            <Plot
  data={[{
    z: resultMatrix,
    text: resultMatrix.map(row => row.map(val => `${val.toFixed(1)}%`)), // <-- KORREKT so!
    texttemplate: "%{text}",
    textfont: { color: "white" },
    x: Array.from({ length: maxGoals }, (_, i) => i),
    y: Array.from({ length: maxGoals }, (_, i) => i),
    type: "heatmap",
    colorscale: [[0, "#e74c3c"], [0.5, "#f39c12"], [1, "#27ae60"]],
    showscale: true,
    hovertemplate: 'Heimtore %{y} : Auswärtstore %{x}<br>%{z}% Wahrscheinlichkeit<extra></extra>',
    zmin: minPercentage,
    zmax: maxPercentage
  }, {
    type: 'scatter',
    mode: 'markers',
    x: [highlightCoords[1]],
    y: [highlightCoords[0]],
    marker: { size: 50, color: 'white', symbol: 'square-open', line: { color: 'black', width: 2} },
    hoverinfo: 'skip'
  }]}
              layout={{
                width: 700,
                height: 600,
                margin: { l: 40, r: 20, t: 30, b: 30 },
                xaxis: { title: "Auswärtstore", tickmode: "linear", dtick: 1, range: [-0.5, maxGoals - 0.5] },
                yaxis: { title: "Heimtore", tickmode: "linear", dtick: 1, range: [-0.5, maxGoals - 0.5] },
                paper_bgcolor: "#36393f",
                plot_bgcolor: "#36393f",
                font: { color: "white" },
              }}
              config={{ responsive: true }}
            />
          </div>
        )}

<div className="text-center text-xl font-bold space-y-05 bg-[#36393f] rounded p-4">
  {topResults.map((res, idx) => {
    const [homeGoals, awayGoals] = res.score.split(":" );
    return (
      <div key={idx} className="flex justify-center items-center gap-2">
        📈 {idx + 1}. {teams.find(t => t.code === homeTeam)?.land} {homeGoals} : {awayGoals} {teams.find(t => t.code === awayTeam)?.land} ({res.percentage.toFixed(1)}%)
      </div>
    );
  })}
</div>
      </div>

      {resultMatrix.length > 0 && (
        <div className="flex justify-center mt-4">
          <button
            onClick={async () => {
              if (chartAreaRef.current) {
                const today = getTodayString();
                const dateTag = document.createElement("div");
                dateTag.textContent = today;
                dateTag.style.position = "absolute";
                dateTag.style.bottom = "10px";
                dateTag.style.right = "10px";
                dateTag.style.color = "white";
                dateTag.style.fontSize = "16px";
                chartAreaRef.current.appendChild(dateTag);
                const canvas = await html2canvas(chartAreaRef.current);
                chartAreaRef.current.removeChild(dateTag);
                const link = document.createElement('a');
                link.download = `${teams.find(t => t.code === homeTeam)?.land}_vs_${teams.find(t => t.code === awayTeam)?.land}_${today}.png`;
                link.href = canvas.toDataURL();
                link.click();
              }
            }}
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            📥 Diagramm exportieren
          </button>
        </div>
      )}
    </div>
  );
}