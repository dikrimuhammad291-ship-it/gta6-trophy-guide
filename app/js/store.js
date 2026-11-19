// Progress store: the earned set and the spoiler setting live in localStorage,
// and export/import moves them as a JSON file. Nothing leaves the browser unless
// the reader exports it.

export const STORAGE_KEY = 'gta6-trophy-guide-progress-v1';

export function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { earned: new Set(), spoiler: false };
    const parsed = JSON.parse(raw);
    const earned = new Set(Array.isArray(parsed.earned) ? parsed.earned.filter((id) => Number.isInteger(id)) : []);
    return { earned, spoiler: parsed.spoiler === true };
  } catch {
    return { earned: new Set(), spoiler: false };
  }
}

export function saveProgress(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    earned: [...state.earned].sort((a, b) => a - b),
    spoiler: state.spoiler,
  }));
}

export function toggleEarned(state, id) {
  if (state.earned.has(id)) state.earned.delete(id);
  else state.earned.add(id);
  saveProgress(state);
}

export function exportProgressFile(state) {
  const payload = JSON.stringify({
    app: 'leonida-ledger',
    game: 'Grand Theft Auto VI',
    exported_at: new Date().toISOString(),
    earned: [...state.earned].sort((a, b) => a - b),
    spoiler: state.spoiler,
  }, null, 2);
  const anchor = document.createElement('a');
  anchor.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  anchor.download = 'gta6-trophy-progress.json';
  anchor.click();
  URL.revokeObjectURL(anchor.href);
}

// Reads an exported file back. Accepts our own format and the plain array of
// ids the starter exported. Returns { earned, spoiler } or throws with a reason.
export async function importProgressFile(file, validIds) {
  const text = await file.text();
  const parsed = JSON.parse(text);
  const ids = Array.isArray(parsed) ? parsed : parsed.earned;
  if (!Array.isArray(ids)) throw new Error('That file holds no earned list.');
  const earned = new Set();
  for (const id of ids) {
    if (Number.isInteger(id) && validIds.has(id)) earned.add(id);
  }
  return { earned, spoiler: parsed && parsed.spoiler === true };
}
