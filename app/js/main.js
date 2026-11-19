// Vice Atlas — boot: load the trophy data, restore saved progress, wire the
// toolbar and tabs, and re-render on every change. The app fetches one file of
// its own, data/trophies.json, and makes no other request at run time.
import { loadEarned, saveEarned, loadSpoilerFree, saveSpoilerFree, exportProgress, importProgress } from './store.js';
import { render } from './render.js';

const state = {
  data: null,
  earned: loadEarned(),
  view: 'tracker',
  search: '',
  kind: 'all',
  grade: 'all',
  status: 'all',
  spoilerFree: loadSpoilerFree(),
  selectedId: null,
};

const actions = {
  toggleEarned(id) {
    if (state.earned.has(id)) state.earned.delete(id);
    else state.earned.add(id);
    saveEarned(state.earned);
    render(state, actions);
  },
  select(id) {
    state.selectedId = id;
    render(state, actions);
  },
};

function wireToolbar() {
  document.getElementById('search').addEventListener('input', (event) => {
    state.search = event.target.value;
    render(state, actions);
  });
  document.getElementById('kindFilter').addEventListener('change', (event) => {
    state.kind = event.target.value;
    render(state, actions);
  });
  document.getElementById('gradeFilter').addEventListener('change', (event) => {
    state.grade = event.target.value;
    render(state, actions);
  });
  document.getElementById('statusFilter').addEventListener('change', (event) => {
    state.status = event.target.value;
    render(state, actions);
  });
  const spoilerBox = document.getElementById('spoilerFree');
  spoilerBox.checked = state.spoilerFree;
  spoilerBox.addEventListener('change', (event) => {
    state.spoilerFree = event.target.checked;
    saveSpoilerFree(state.spoilerFree);
    render(state, actions);
  });
  document.getElementById('exportBtn').addEventListener('click', () => {
    exportProgress(state.earned, state.spoilerFree);
  });
  document.getElementById('importFile').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const imported = await importProgress(file);
    if (imported) {
      state.earned = imported.earned;
      state.spoilerFree = imported.spoilerFree;
      spoilerBox.checked = state.spoilerFree;
      saveEarned(state.earned);
      saveSpoilerFree(state.spoilerFree);
      render(state, actions);
    } else {
      window.alert('That file is not a Vice Atlas progress export.');
    }
    event.target.value = '';
  });
  document.querySelectorAll('#tabs button').forEach((button) => {
    button.addEventListener('click', () => {
      state.view = button.dataset.view;
      render(state, actions);
    });
  });
}

async function boot() {
  const response = await fetch('data/trophies.json');
  state.data = await response.json();
  // The missable pill counts the flagged trophies in the data, not a hard number.
  document.getElementById('missableCount').textContent = String(
    state.data.trophies.filter((t) => t.missable).length,
  );
  wireToolbar();
  render(state, actions);
}

boot();
