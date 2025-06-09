import { readDir, readTextFile, writeTextFile, createDir, BaseDirectory, FileEntry } from '@tauri-apps/api/fs';
import { appDataDir, join } from '@tauri-apps/api/path';
import type { MatchResult } from '../contexts/ResultsContext';

export interface SaveData {
  settings: {
    drawChance: number;
    monteCarloRuns: number;
    formVsRanking: number;
  };
  results: Record<string, MatchResult[]>;
}

const SAVE_FOLDER = 'saves';

async function ensureSaveDir(): Promise<string> {
  const dir = await appDataDir();
  const saveDir = await join(dir, SAVE_FOLDER);
  await createDir(saveDir, { recursive: true });
  return saveDir;
}

export async function saveToFile(data: SaveData): Promise<void> {
  const dir = await ensureSaveDir();
  const filePath = await join(dir, `${Date.now()}.json`);
  await writeTextFile(filePath, JSON.stringify(data));
}

export async function loadLatestFile(): Promise<SaveData | null> {
  const dir = await ensureSaveDir();
  let entries: FileEntry[];
  try {
    entries = await readDir(dir);
  } catch {
    return null;
  }
  const files = entries.filter(e => !e.children && e.name?.endsWith('.json'));
  if (files.length === 0) return null;
  files.sort((a, b) => (b.name! > a.name! ? 1 : -1));
  const latest = files[0];
  try {
    const content = await readTextFile(latest.path);
    return JSON.parse(content) as SaveData;
  } catch {
    return null;
  }
}
