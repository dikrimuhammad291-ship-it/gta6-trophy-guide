// Leonida Ledger — boot. Loads the trophy data, restores the reader's saved
// progress, and wires the tracker, roadmap and missables views together.

import { applyFilters } from './filters.js';
import { exportProgressFile, importProgressFile, loadProgress, saveProgress, toggleEarned } from './store.js';
import { renderChecklist, renderGuideDetail, renderMissables, renderProgress, renderRoadmap } from './views.js';

// The trophy the detail pane opens on first: a silver with a counted target,
// a full guide and its sources beside it.
const DEFAULT_SELECTED_ID = 17;

const doc = await (await fetch('data/trophies.json')).json();
const state = loadProgress();
const validIds = new Set(doc.trophies.map((trophy) => trophy.id));
let selectedId = doc.trophies.some((trophy) => trophy.id === DEFAULT_SELECTED_ID) ? DEFAULT_SELECTED_ID : doc.trophies[0].id;
let view = 'tracker';

const filters = { query: '', kind: 'all', grade: 'all', status: 'all' };

function selectedTrophy() {
  return doc.trophies.find((trophy) => trophy.id === selectedId) ?? null;
}

function renderAll() {
  renderProgress(doc, state);
  const visible = applyFilters(doc.trophies, filters, state.earned);
  renderChecklist(doc, visible, state, selectedId, callbacks);
  renderGuideDetail(doc, selectedTrophy(), state, callbacks);
  renderRoadmap(doc, state, callbacks);
  renderMissables(doc, state, callbacks);
  document.getElementById('missableCount').textContent = String(doc.trophies.filter((t) => t.missable).length);
}

const callbacks = {
  onSelect(id) {
    selectedId = id;
    showView('tracker');
    renderAll();
    document.getElementById('detailPane').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  },
  onToggle(id) {
    toggleEarned(state, id);
    renderAll();
  },
  onShowRoadmap() {
    showView('roadmap');
  },
};

function showView(next) {
  view = next;
  document.getElementById('main').hidden = view !== 'tracker';
  document.getElementById('toolbar').hidden = view !== 'tracker';
  document.getElementById('roadmapPane').hidden = view !== 'roadmap';
  document.getElementById('missablesPane').hidden = view !== 'missables';
  for (const button of document.querySelectorAll('#tabs button')) {
    button.classList.toggle('active', button.dataset.view === view);
  }
}

document.getElementById('tabs').addEventListener('click', (event) => {
  const button = event.target.closest('button[data-view]');
  if (button) showView(button.dataset.view);
});

document.getElementById('search').addEventListener('input', (event) => {
  filters.query = event.target.value;
  renderAll();
});
document.getElementById('kind').addEventListener('change', (event) => {
  filters.kind = event.target.value;
  renderAll();
});
document.getElementById('grade').addEventListener('change', (event) => {
  filters.grade = event.target.value;
  renderAll();
});
document.getElementById('status').addEventListener('change', (event) => {
  filters.status = event.target.value;
  renderAll();
});

const spoilerBox = document.getElementById('spoiler');
spoilerBox.checked = state.spoiler;
spoilerBox.addEventListener('change', () => {
  state.spoiler = spoilerBox.checked;
  saveProgress(state);
  renderAll();
});

document.getElementById('exportBtn').addEventListener('click', () => exportProgressFile(state));

document.getElementById('importFile').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  try {
    const imported = await importProgressFile(file, validIds);
    state.earned = imported.earned;
    state.spoiler = imported.spoiler;
    spoilerBox.checked = state.spoiler;
    saveProgress(state);
    renderAll();
  } catch (error) {
    alert(`Could not import that file: ${error.message}`);
  }
});

renderAll();
