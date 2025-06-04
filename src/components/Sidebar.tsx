// Sidebar.tsx
import { useState } from 'react';
import { motion } from 'framer-motion';

const sections = [
  'Übersicht',
  'Begegnungen',
  ...Array.from({ length: 12 }, (_, i) => `Gruppe ${String.fromCharCode(65 + i)}`),
  'Qualifiziert',
  'Parameter',
  'Weltrangliste',
  'Statistik','Fantasy Match'
];

export default function Sidebar({ current, setCurrent }: { current: string, setCurrent: (val: string) => void }) {
  const [open, setOpen] = useState(true);

  return (
    <motion.div
      animate={{ width: open ? 240 : 64 }}
      transition={{ duration: 0.3 }}
      className="h-screen bg-[#2f3136] text-white flex flex-col shadow-lg"
    >
      <div className="flex items-center justify-between p-4">
        {open && <h1 className="text-lg font-bold">⚽ WM-Quali</h1>}
        <button onClick={() => setOpen(!open)} className="text-white text-xl">
          {open ? '❮' : '❯'}
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto space-y-1">
        {sections.map((section) => (
          <button
            key={section}
            onClick={() => setCurrent(section)}
            className={`w-full text-left px-4 py-2 hover:bg-[#40444b] ${
              current === section ? 'bg-[#7289da]' : ''
            } ${open ? 'block' : 'truncate'}`}
          >
            {open ? section : section.slice(0, 2)}
          </button>
        ))}
      </nav>
    </motion.div>
  );
}
