// Vice Atlas — views: the tracker list, the guide detail pane, the roadmap and
// the missables list, plus the progress header. Every view reads the same state
// object the boot module owns, and reports clicks back through `actions`.

const KIND_LABELS = {
  story: 'Story', mission: 'Mission', side: 'Side strand', collectible: 'Collectible',
  activity: 'Activity', combat: 'Combat', misc: 'Misc', platinum: 'Platinum',
};
const GRADE_LABELS = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };
const STORY_KINDS = new Set(['story', 'mission']);

export function escapeHtml(text) {
  return String(text)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

// A story or mission trophy stays hidden while spoiler-free is on and it is not
// earned yet: its name and description are the spoiler, so both are masked.
export function isSpoilerHidden(trophy, state) {
  return state.spoilerFree && STORY_KINDS.has(trophy.kind) && !state.earned.has(trophy.id);
}

function matchesFilters(trophy, state) {
  if (state.kind !== 'all' && trophy.kind !== state.kind) return false;
  if (state.grade !== 'all' && trophy.grade !== state.grade) return false;
  if (state.status === 'earned' && !state.earned.has(trophy.id)) return false;
  if (state.status === 'remaining' && state.earned.has(trophy.id)) return false;
  const query = state.search.trim().toLowerCase();
  if (query) {
    const haystack = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  return true;
}

function countLabel(trophy) {
  if (trophy.count === undefined || trophy.count === null) return '';
  const value = trophy.count >= 1000 ? trophy.count.toLocaleString('en-US') : String(trophy.count);
  return `<span class="tag count">PSN count: ${value}</span>`;
}

function trophyRow(trophy, state, actions) {
  const earned = state.earned.has(trophy.id);
  const hidden = isSpoilerHidden(trophy, state);
  const selected = state.selectedId === trophy.id;
  const name = hidden ? 'Hidden story trophy' : trophy.name;
  const desc = hidden ? 'Earn it to reveal its name and description.' : trophy.description;
  const row = document.createElement('article');
  row.className = `trophy${earned ? ' earned' : ''}${selected ? ' selected' : ''}${hidden ? ' spoiler-hidden' : ''}`;
  row.dataset.id = String(trophy.id);
  row.innerHTML = `
    <input type="checkbox" ${earned ? 'checked' : ''} aria-label="Mark ${escapeHtml(name)} earned">
    <div class="trophy-body">
      <div class="trophy-name">${escapeHtml(name)}${earned ? ' <span class="earned-mark">✓ earned</span>' : ''}</div>
      <div class="trophy-desc">${escapeHtml(desc)}</div>
      <div class="trophy-meta">
        <span class="tag grade-${trophy.grade}">${GRADE_LABELS[trophy.grade]}</span>
        <span class="tag">${KIND_LABELS[trophy.kind] ?? trophy.kind}</span>
        ${trophy.missable ? '<span class="tag missable">Missable</span>' : ''}
        ${trophy.hidden ? '<span class="tag hidden-psn">Hidden on PSN</span>' : ''}
        ${countLabel(trophy)}
      </div>
    </div>`;
  const box = row.querySelector('input');
  // A click on the checkbox toggles earned only; it must not also select the row.
  box.addEventListener('click', (event) => event.stopPropagation());
  box.addEventListener('change', (event) => {
    event.stopPropagation();
    actions.toggleEarned(trophy.id);
  });
  row.addEventListener('click', () => actions.select(trophy.id));
  return row;
}

export function renderProgress(state) {
  const total = state.data.trophies.length;
  const earnedCount = state.earned.size;
  const progressText = document.getElementById('progressText');
  const progressFill = document.getElementById('progressFill');
  const progressBar = progressFill.parentElement;
  const gradeCounts = document.getElementById('gradeCounts');
  const nextUp = document.getElementById('nextUp');
  progressText.textContent = `${earnedCount} of ${total} earned`;
  progressFill.style.width = `${(earnedCount / total) * 100}%`;
  progressBar.setAttribute('aria-valuenow', String(earnedCount));
  gradeCounts.innerHTML = ['platinum', 'gold', 'silver', 'bronze']
    .map((grade) => {
      const ofGrade = state.data.trophies.filter((t) => t.grade === grade);
      const got = ofGrade.filter((t) => state.earned.has(t.id)).length;
      return `<span><b>${got}/${ofGrade.length}</b> ${GRADE_LABELS[grade]}</span>`;
    })
    .join('');
  // Next up: the first unearned trophy in roadmap order.
  const next = state.data.trophies
    .filter((t) => !state.earned.has(t.id))
    .sort((a, b) => (a.roadmap - b.roadmap) || (a.id - b.id))[0];
  nextUp.textContent = next ? `Next up: ${isSpoilerHidden(next, state) ? 'a hidden story trophy' : next.name}` : 'Platinum earned — Leonida Legend!';
}

export function renderTracker(state, actions) {
  const pane = document.getElementById('listPane');
  pane.innerHTML = '';
  const shown = state.data.trophies.filter((t) => matchesFilters(t, state));
  if (shown.length === 0) {
    const note = document.createElement('p');
    note.className = 'empty-note';
    note.textContent = 'No trophies match these filters. Clear the search or widen the filters to see the list again.';
    pane.appendChild(note);
    return;
  }
  const head = document.createElement('p');
  head.className = 'empty-note';
  head.style.padding = '0 .5rem .8rem';
  head.textContent = `Showing ${shown.length} of ${state.data.trophies.length} trophies — tick a box to mark one earned, click a row to read its guide.`;
  pane.appendChild(head);
  for (const trophy of shown) pane.appendChild(trophyRow(trophy, state, actions));
}

export function renderDetail(state, actions) {
  const pane = document.getElementById('detailPane');
  const trophy = state.data.trophies.find((t) => t.id === state.selectedId);
  if (!trophy) {
    pane.innerHTML = `<div class="detail-card"><div class="detail-empty">Select a trophy on the left to read its guide, its sources and when it can be missed.</div></div>`;
    return;
  }
  const hidden = isSpoilerHidden(trophy, state);
  const earned = state.earned.has(trophy.id);
  const sourceItems = (trophy.sources ?? []).map((key) => {
    const source = state.data.sources[key];
    if (!source) return '';
    const link = source.url
      ? `<a href="${escapeHtml(source.url)}" rel="noopener">${escapeHtml(source.name)}</a>`
      : escapeHtml(source.name);
    return `<li>${link} — ${escapeHtml(source.covers)}</li>`;
  }).join('');
  const stage = state.data.roadmap.find((s) => s.stage === trophy.roadmap);
  pane.innerHTML = `
    <div class="detail-card">
      <h2>${escapeHtml(hidden ? 'Hidden story trophy' : trophy.name)}</h2>
      <p class="official">${escapeHtml(hidden ? 'Its name and description stay hidden while spoiler-free is on. Earn it to reveal them.' : trophy.description)}</p>
      <div class="trophy-meta">
        <span class="tag grade-${trophy.grade}">${GRADE_LABELS[trophy.grade]}</span>
        <span class="tag">${KIND_LABELS[trophy.kind] ?? trophy.kind}</span>
        ${trophy.missable ? '<span class="tag missable">Missable</span>' : ''}
        ${trophy.hidden ? '<span class="tag hidden-psn">Hidden on PSN</span>' : ''}
        ${countLabel(trophy)}
        ${stage ? `<span class="tag">Roadmap stage ${stage.stage}</span>` : ''}
        ${earned ? '<span class="tag count">Earned ✓</span>' : ''}
      </div>
      ${hidden ? '' : `<h3>Guide</h3><p>${escapeHtml(trophy.guide)}</p>`}
      ${trophy.missable && !hidden ? `<div class="missable-note"><strong>Missable — watch for it.</strong> This one is tied to a specific moment or a single attempt, so read the guide before the moment passes; the Missables view lists every trophy like this one.</div>` : ''}
      <h3>Sources</h3>
      <ul class="sources">${sourceItems}</ul>
    </div>`;
}

export function renderRoadmap(state, actions) {
  const pane = document.getElementById('listPane');
  pane.innerHTML = '';
  const intro = document.createElement('p');
  intro.className = 'miss-intro';
  intro.textContent = 'The road to the platinum in four stages, built from the official descriptions: the story first, then the stranger strands, then the activities and collectibles, and finally the long grinds. Each stage shows its own progress.';
  pane.appendChild(intro);
  for (const stage of state.data.roadmap) {
    const members = stage.trophies
      .map((id) => state.data.trophies.find((t) => t.id === id))
      .filter(Boolean);
    const got = members.filter((t) => state.earned.has(t.id)).length;
    const card = document.createElement('section');
    card.className = 'stage';
    card.innerHTML = `
      <div class="stage-head"><h2>Stage ${stage.stage}: ${escapeHtml(stage.title)}</h2><span class="stage-count">${got} of ${members.length} earned</span></div>
      <div class="stage-bar"><div style="width: ${(got / members.length) * 100}%"></div></div>
      <p class="stage-note">${escapeHtml(stage.note)}</p>
      <ul class="stage-list">
        ${members.map((t) => {
          const hidden = isSpoilerHidden(t, state);
          const done = state.earned.has(t.id);
          return `<li class="${done ? 'done' : 'todo'}" data-id="${t.id}" style="cursor:pointer">${done ? '✓' : '○'} ${escapeHtml(hidden ? 'Hidden story trophy' : t.name)}</li>`;
        }).join('')}
      </ul>`;
    card.querySelectorAll('li[data-id]').forEach((li) => {
      li.addEventListener('click', () => actions.select(Number(li.dataset.id)));
    });
    pane.appendChild(card);
  }
}

export function renderMissables(state, actions) {
  const pane = document.getElementById('listPane');
  pane.innerHTML = '';
  const flagged = state.data.trophies.filter((t) => t.missable);
  const intro = document.createElement('p');
  intro.className = 'miss-intro';
  intro.textContent = `These ${flagged.length} trophies are tied to a specific moment, a single attempt or a choice — the ones to catch while the moment is there. Each guide says what to watch for; tick them off as you catch them.`;
  pane.appendChild(intro);
  for (const trophy of flagged) pane.appendChild(trophyRow(trophy, state, actions));
}

export function render(state, actions) {
  renderProgress(state);
  if (state.view === 'roadmap') renderRoadmap(state, actions);
  else if (state.view === 'missables') renderMissables(state, actions);
  else renderTracker(state, actions);
  renderDetail(state, actions);
  document.querySelectorAll('#tabs button').forEach((button) => {
    button.classList.toggle('active', button.dataset.view === state.view);
  });
}
