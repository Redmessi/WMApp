// src/components/Weltrangliste.tsx
import { useEffect, useState } from 'react';
import { writeTextFile, readTextFile, BaseDirectory } from '@tauri-apps/api/fs';

interface Team {
  code: string;
  land: string;
  rang: number;
  gruppe: string;
}

export const initialData: Team[] = [
  { code: 'ESP', land: 'Spanien', rang: 2, gruppe: 'E' },
  { code: 'FRA', land: 'Frankreich', rang: 3, gruppe: 'D' },
  { code: 'ENG', land: 'England', rang: 4, gruppe: 'K' },
  { code: 'NED', land: 'Niederlande', rang: 6, gruppe: 'G' },
  { code: 'POR', land: 'Portugal', rang: 7, gruppe: 'F' },
  { code: 'BEL', land: 'Belgien', rang: 8, gruppe: 'J' },
  { code: 'ITA', land: 'Italien', rang: 9, gruppe: 'I' },
  { code: 'GER', land: 'Deutschland', rang: 10, gruppe: 'A' },
  { code: 'CRO', land: 'Kroatien', rang: 11, gruppe: 'L' },
  { code: 'SUI', land: 'Schweiz', rang: 20, gruppe: 'B' },
  { code: 'DEN', land: 'Dänemark', rang: 21, gruppe: 'C' },
  { code: 'AUT', land: 'Österreich', rang: 22, gruppe: 'H' },
  { code: 'UKR', land: 'Ukraine', rang: 25, gruppe: 'D' },
  { code: 'TUR', land: 'Türkei', rang: 27, gruppe: 'E' },
  { code: 'SWE', land: 'Schweden', rang: 28, gruppe: 'B' },
  { code: 'WAL', land: 'Wales', rang: 29, gruppe: 'J' },
  { code: 'SRB', land: 'Serbien', rang: 31, gruppe: 'K' },
  { code: 'POL', land: 'Polen', rang: 34, gruppe: 'G' },
  { code: 'RUS', land: 'Russland', rang: 35, gruppe: 'X' },
  { code: 'HUN', land: 'Ungarn', rang: 37, gruppe: 'F' },
  { code: 'NOR', land: 'Norwegen', rang: 38, gruppe: 'I' },
  { code: 'CZE', land: 'Tschechien', rang: 39, gruppe: 'L' },
  { code: 'GRE', land: 'Griechenland', rang: 40, gruppe: 'C' },
  { code: 'SCO', land: 'Schottland', rang: 44, gruppe: 'C' },
  { code: 'ROU', land: 'Rumänien', rang: 45, gruppe: 'H' },
  { code: 'SVK', land: 'Slowakei', rang: 46, gruppe: 'A' },
  { code: 'SVN', land: 'Slowenien', rang: 51, gruppe: 'B' },
  { code: 'IRL', land: 'Irland', rang: 60, gruppe: 'F' },
  { code: 'ALB', land: 'Albanien', rang: 66, gruppe: 'K' },
  { code: 'MKD', land: 'Nordmazedonien', rang: 67, gruppe: 'J' },
  { code: 'GEO', land: 'Georgia', rang: 68, gruppe: 'E' },
  { code: 'FIN', land: 'Finnland', rang: 69, gruppe: 'G' },
  { code: 'BIH', land: 'Bosnien und Herzegowina', rang: 70, gruppe: 'H' },
  { code: 'NIR', land: 'Nordirland', rang: 71, gruppe: 'A' },
  { code: 'MNE', land: 'Montenegro', rang: 73, gruppe: 'L' },
  { code: 'ISL', land: 'Island', rang: 74, gruppe: 'D' },
  { code: 'ISR', land: 'Israel', rang: 78, gruppe: 'I' },
  { code: 'BUL', land: 'Bulgarien', rang: 85, gruppe: 'E' },
  { code: 'LUX', land: 'Luxemburg', rang: 91, gruppe: 'A' },
  { code: 'KOS', land: 'Kosovo', rang: 97, gruppe: 'B' },
  { code: 'BLR', land: 'Belarus', rang: 98, gruppe: 'C' },
  { code: 'ARM', land: 'Armenien', rang: 102, gruppe: 'F' },
  { code: 'KAZ', land: 'Kasachstan', rang: 113, gruppe: 'J' },
  { code: 'AZE', land: 'Aserbaidschan', rang: 119, gruppe: 'D' },
  { code: 'EST', land: 'Estland', rang: 121, gruppe: 'I' },
  { code: 'CYP', land: 'Republik Zypern', rang: 129, gruppe: 'H' },
  { code: 'LAT', land: 'Lettland', rang: 138, gruppe: 'K' },
  { code: 'FRO', land: 'Färöer', rang: 141, gruppe: 'L' },
  { code: 'LTU', land: 'Litauen', rang: 143, gruppe: 'G' },
  { code: 'MDA', land: 'Republik Moldau', rang: 154, gruppe: 'I' },
  { code: 'MLT', land: 'Malta', rang: 169, gruppe: 'G' },
  { code: 'AND', land: 'Andorra', rang: 173, gruppe: 'K' },
  { code: 'GIB', land: 'Gibraltar', rang: 196, gruppe: 'L' },
  { code: 'LIE', land: 'Liechtenstein', rang: 205, gruppe: 'J' },
  { code: 'SMR', land: 'San Marino', rang: 210, gruppe: 'H' }
];

const STORAGE_KEY = 'weltrangliste.json';

export default function Weltrangliste() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [sortKey, setSortKey] = useState<'land' | 'rang' | 'gruppe'>('rang');
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    readTextFile(STORAGE_KEY, { dir: BaseDirectory.App })
      .then(content => setTeams(JSON.parse(content)))
      .catch(() => setTeams(initialData));
  }, []);

  const updateRang = (code: string, newRang: number) => {
    setTeams(prev =>
      prev.map(t => (t.code === code ? { ...t, rang: newRang } : t))
    );
  };

  const saveData = async () => {
    await writeTextFile(STORAGE_KEY, JSON.stringify(teams), {
      dir: BaseDirectory.App
    });
    alert('Daten gespeichert');
  };

  const handleSort = (key: 'land' | 'rang' | 'gruppe') => {
    setSortKey(key);
    setSortAsc(prev => (key === sortKey ? !prev : true));
  };

  const sortedTeams = [...teams].sort((a, b) => {
    const aValue = a[sortKey];
    const bValue = b[sortKey];
    if (aValue < bValue) return sortAsc ? -1 : 1;
    if (aValue > bValue) return sortAsc ? 1 : -1;
    return 0;
  });

  const getArrow = (key: 'land' | 'rang' | 'gruppe') => {
    if (sortKey !== key) return '';
    return sortAsc ? ' 🔼' : ' 🔽';
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">🌍 Weltrangliste</h2>
      <table className="w-full table-auto text-left border border-white/20">
        <thead>
          <tr className="bg-[#7289da] text-white">
            <th className="p-2">Flagge</th>
            <th
              className="p-2 cursor-pointer"
              onClick={() => handleSort('land')}
            >
              Team{getArrow('land')}
            </th>
            <th
              className="p-2 cursor-pointer"
              onClick={() => handleSort('rang')}
            >
              Rang{getArrow('rang')}
            </th>
            <th
              className="p-2 cursor-pointer"
              onClick={() => handleSort('gruppe')}
            >
              Gruppe{getArrow('gruppe')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedTeams.map(team => (
            <tr key={team.code} className="border-t border-white/10">
              <td className="p-2">
                <img
                  src={`/flags/${team.code.toLowerCase()}.svg`}
                  alt={team.code}
                  className="w-6 h-4 inline"
                />
              </td>
              <td className="p-2">{team.land}</td>
              <td className="p-2">
                <input
                  type="number"
                  value={team.rang}
                  className="bg-[#2f3136] text-white border border-white/20 p-1 w-16"
                  onChange={e => updateRang(team.code, parseInt(e.target.value))}
                />
              </td>
              <td className="p-2">{team.gruppe}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={saveData}
        className="mt-4 px-4 py-2 bg-[#7289da] text-white rounded hover:bg-[#5b6eae]"
      >
        💾 Speichern
      </button>
    </div>
  );
}
