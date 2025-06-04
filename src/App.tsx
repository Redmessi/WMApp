// src/App.tsx
import { useState } from "react";
import Sidebar from "./components/Sidebar";
import Weltrangliste from "./components/Weltrangliste";
import Parameter from "./components/Parameter";
import GruppeA from "./components/GruppeA";
import GruppeB from "./components/GruppeB";
import GruppeC from "./components/GruppeC";
import GruppeD from "./components/GruppeD";
import GruppeE from "./components/GruppeE";
import GruppeF from "./components/GruppeF";
import GruppeG from "./components/GruppeG";
import GruppeH from "./components/GruppeH";
import GruppeI from "./components/GruppeI";
import GruppeJ from "./components/GruppeJ";
import GruppeK from "./components/GruppeK";
import GruppeL from "./components/GruppeL";
import Statistik from "./components/Statistik";
import Begegnungen from "./components/Begegnungen";
import Qualifiziert from "./components/Qualifiziert";
import Übersicht from "./components/Übersicht";
import FantasyMatch from "./components/FantasyMatch";



// Context-Provider importieren
import { ResultsProvider } from "./contexts/ResultsContext";

export default function App() {
  const [current, setCurrent] = useState("Übersicht");

  return (
    // 1️⃣ Hier umschließen wir alles mit dem Provider
    <ResultsProvider>
      <div className="flex h-screen font-sans text-white">
        <Sidebar current={current} setCurrent={setCurrent} />
        <div className="flex-1 bg-[#36393f] p-6 overflow-y-auto">
          <h2 className="text-2xl font-bold mb-4">{current}</h2>

          {/* 2️⃣ Deine Routen */}
          {current === "Übersicht" && <Übersicht/>}
          {current === "Weltrangliste" && <Weltrangliste />}
          {current === "Parameter" && <Parameter />}
          {current === "Gruppe A" && <GruppeA />}
          {current === "Gruppe B" && <GruppeB />}
          {current === "Gruppe C" && <GruppeC />}
          {current === "Gruppe D" && <GruppeD />}
          {current === "Gruppe E" && <GruppeE />}
          {current === "Gruppe F" && <GruppeF />}
          {current === "Gruppe G" && <GruppeG />}
          {current === "Gruppe H" && <GruppeH />}
          {current === "Gruppe I" && <GruppeI />}
          {current === "Gruppe J" && <GruppeJ />}
          {current === "Gruppe K" && <GruppeK />}
          {current === "Gruppe L" && <GruppeL />}
          {current === "Statistik" && <Statistik />}
          {current === "Begegnungen" && <Begegnungen />}
          {current === "Qualifiziert" && <Qualifiziert />}
          {current === "Fantasy Match" && <FantasyMatch />}



        </div>
      </div>
    </ResultsProvider>
  );
}
