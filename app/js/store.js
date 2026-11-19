// Vice Atlas — progress store: the earned set and the spoiler setting live in
// localStorage, and progress can be exported to a JSON file and imported back.
// Nothing leaves the browser except through the user's own export.
const KEY = 'vice-atlas-progress-v1';

function readRaw() {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return null;
    return data;
  } catch {
    return null;
  }
}

function writeRaw(data) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    // Storage full or blocked: the app keeps working in memory only.
  }
}

// The earned set, as an array of trophy ids the user has checked off.
export function loadEarned() {
  const data = readRaw();
  const ids = Array.isArray(data?.earned) ? data.earned : [];
  return new Set(ids.filter((id) => Number.isInteger(id)));
}

export function saveEarned(earned) {
  const data = readRaw() ?? {};
  data.earned = [...earned].sort((a, b) => a - b);
  writeRaw(data);
}

export function loadSpoilerFree() {
  const data = readRaw();
  return data?.spoilerFree === true;
}

export function saveSpoilerFree(on) {
  const data = readRaw() ?? {};
  data.spoilerFree = on;
  writeRaw(data);
}

// Export: a small JSON file the user can keep or move to another browser.
export function exportProgress(earned, spoilerFree) {
  const payload = {
    app: 'vice-atlas',
    version: 1,
    exportedAt: new Date().toISOString(),
    earned: [...earned].sort((a, b) => a - b),
    spoilerFree,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'vice-atlas-progress.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// Import: read a file the user exported before; returns the earned set it held,
// or null when the file is not a Vice Atlas export.
export async function importProgress(file) {
  const text = await file.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!data || data.app !== 'vice-atlas' || !Array.isArray(data.earned)) return null;
  return {
    earned: new Set(data.earned.filter((id) => Number.isInteger(id))),
    spoilerFree: data.spoilerFree === true,
  };
}
