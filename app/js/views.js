// Views: the checklist, the guide detail pane, the roadmap and the missables
// page. Every view is built with DOM calls, never innerHTML, so trophy names
// and descriptions are shown exactly as PlayStation publishes them.

import { KIND_LABELS, gradeCounts, nextUnearnedTrophy, spoilerHidesTrophy } from './filters.js';

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function gradeBadge(trophy) {
  const badge = el('span', `badge ${trophy.grade}`, trophy.grade);
  badge.title = `${trophy.grade} trophy`;
  return badge;
}

function kindBadge(trophy) {
  return el('span', 'badge kind', KIND_LABELS[trophy.kind] ?? trophy.kind);
}

function countBadge(trophy) {
  if (trophy.count === null || trophy.count === undefined) return null;
  const label = trophy.count >= 1000 ? trophy.count.toLocaleString('en-US') : String(trophy.count);
  const badge = el('span', 'badge count', `PSN counts to ${label}`);
  badge.title = 'The progress target PlayStation tracks for this trophy';
  return badge;
}

export function renderProgress(doc, state) {
  const earned = state.earned.size;
  const total = doc.trophies.length;
  document.getElementById('progressText').textContent = `${earned} of ${total} earned`;
  document.getElementById('progressFill').style.width = `${Math.round((earned / total) * 100)}%`;
  const next = nextUnearnedTrophy(doc.trophies, doc.roadmap, state.earned);
  const nextUp = document.getElementById('nextUp');
  nextUp.replaceChildren();
  if (next) {
    nextUp.append('Next up: ');
    nextUp.append(el('b', undefined, next.name));
  } else {
    nextUp.textContent = 'Every trophy earned — Leonida Legend.';
  }
  const counts = gradeCounts(doc.trophies, state.earned);
  const countsNode = document.getElementById('gradeCounts');
  countsNode.replaceChildren();
  for (const grade of ['platinum', 'gold', 'silver', 'bronze']) {
    const span = el('span');
    span.append(`${grade[0].toUpperCase()}${grade.slice(1)} `);
    span.append(el('b', undefined, `${counts[grade][0]}/${counts[grade][1]}`));
    countsNode.append(span);
  }
}

export function renderChecklist(doc, visible, state, selectedId, callbacks) {
  const list = document.getElementById('trophyList');
  list.replaceChildren();
  document.getElementById('resultCount').textContent =
    `${visible.length} of ${doc.trophies.length} trophies shown`;
  document.getElementById('emptyNote').hidden = visible.length > 0;
  for (const trophy of visible) {
    const hidden = spoilerHidesTrophy(trophy, state.spoiler, state.earned);
    const row = el('li', 'trophy-row');
    if (trophy.id === selectedId) row.classList.add('selected');
    if (state.earned.has(trophy.id)) row.classList.add('earned');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = state.earned.has(trophy.id);
    box.setAttribute('aria-label', `Earned: ${trophy.name}`);
    // Stop the click reaching the row: the row's select handler re-renders the
    // list, which would detach this checkbox before its change event fires.
    box.addEventListener('click', (event) => event.stopPropagation());
    box.addEventListener('change', (event) => {
      event.stopPropagation();
      callbacks.onToggle(trophy.id);
    });
    const body = el('div');
    body.append(el('div', 'trophy-name', hidden ? 'Hidden story trophy' : trophy.name));
    body.append(el('div', 'trophy-desc', hidden ? 'Hidden until earned — spoiler-free is on.' : trophy.description));
    const meta = el('div', 'trophy-meta');
    meta.append(gradeBadge(trophy), kindBadge(trophy));
    if (trophy.hidden) meta.append(el('span', 'badge hidden', 'Hidden on PSN'));
    if (trophy.missable) meta.append(el('span', 'badge missable', 'Missable'));
    const count = countBadge(trophy);
    if (count) meta.append(count);
    body.append(meta);
    const check = el('div', 'trophy-check');
    if (state.earned.has(trophy.id)) check.append(el('span', 'earned-mark', '✓ Earned'));
    row.append(box, body, check);
    row.addEventListener('click', () => callbacks.onSelect(trophy.id));
    list.append(row);
  }
}

function sourceListItem(doc, key) {
  const source = doc.sources[key];
  const item = el('li');
  if (!source) {
    item.textContent = key;
    return item;
  }
  if (source.url) {
    const link = document.createElement('a');
    link.href = source.url;
    link.textContent = source.name;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    item.append(link);
  } else {
    item.append(el('span', undefined, source.name));
  }
  item.append(el('span', 'covers', ` — ${source.covers}`));
  return item;
}

export function renderGuideDetail(doc, trophy, state, callbacks) {
  const pane = document.getElementById('detailPane');
  pane.replaceChildren();
  if (!trophy) {
    pane.append(el('p', undefined, 'Select a trophy to read its guide.'));
    return;
  }
  const hidden = spoilerHidesTrophy(trophy, state.spoiler, state.earned);
  pane.append(el('h2', undefined, hidden ? 'Hidden story trophy' : trophy.name));
  pane.append(el('p', 'official', hidden ? 'Its name and description stay hidden until you earn it.' : trophy.description));
  const meta = el('div', 'trophy-meta');
  meta.append(gradeBadge(trophy), kindBadge(trophy));
  if (trophy.hidden) meta.append(el('span', 'badge hidden', 'Hidden on PSN'));
  if (trophy.missable) meta.append(el('span', 'badge missable', 'Missable'));
  const count = countBadge(trophy);
  if (count) meta.append(count);
  pane.append(meta);
  const guide = el('div', 'guide');
  if (hidden) {
    guide.append(el('p', undefined, 'Spoiler-free is on. Turn it off, or earn this trophy, to read its guide.'));
  } else {
    guide.append(el('p', undefined, trophy.guide));
  }
  pane.append(guide);
  if (trophy.missable && !hidden) {
    pane.append(el('p', 'missable-note', 'Missable: this trophy needs a specific moment or setup. The guide above says what to watch for — do it when the chance comes.'));
  }
  if (!hidden) {
    const sources = el('div', 'sources');
    sources.append(el('h3', undefined, 'Sources'));
    const list = el('ul');
    for (const key of trophy.sources) list.append(sourceListItem(doc, key));
    sources.append(list);
    pane.append(sources);
  }
  const actions = el('div', 'detail-actions');
  const earned = state.earned.has(trophy.id);
  const toggle = el('button', undefined, earned ? 'Mark as not earned' : 'Mark as earned');
  toggle.addEventListener('click', () => callbacks.onToggle(trophy.id));
  const stage = doc.roadmap.find((s) => s.trophies.includes(trophy.id));
  if (stage) {
    const road = el('button', 'secondary', `Roadmap stage ${stage.stage}`);
    road.addEventListener('click', () => callbacks.onShowRoadmap());
    actions.append(road);
  }
  actions.append(toggle);
  pane.append(actions);
}

export function renderRoadmap(doc, state, callbacks) {
  const pane = document.getElementById('roadmapPane');
  pane.replaceChildren();
  pane.append(el('h2', undefined, 'Roadmap to the platinum'));
  pane.append(el('p', 'intro', 'Fifty-five trophies in four stages, built from the official descriptions: the story first, then the stranger strands, then activities and collectibles, and the long grinds last. Story trophies are unmissable; the flagged missables are the ones to watch.'));
  for (const stage of doc.roadmap) {
    const trophies = stage.trophies
      .map((id) => doc.trophies.find((trophy) => trophy.id === id))
      .filter(Boolean);
    const earned = trophies.filter((trophy) => state.earned.has(trophy.id)).length;
    const section = el('section', 'stage');
    section.append(el('h3', undefined, `Stage ${stage.stage} — ${stage.title}`));
    section.append(el('p', 'stage-meta', `${earned} of ${trophies.length} earned · ${stage.trophies.length} trophies`));
    section.append(el('p', 'stage-note', stage.note));
    const bar = el('div', 'stage-bar');
    bar.append(el('div'));
    bar.firstChild.style.width = `${Math.round((earned / trophies.length) * 100)}%`;
    section.append(bar);
    const chips = el('ul', 'chip-list');
    for (const trophy of trophies) {
      const chip = el('li', undefined, trophy.name);
      if (state.earned.has(trophy.id)) chip.classList.add('earned');
      if (trophy.missable) chip.classList.add('missable');
      chip.title = trophy.missable ? `${trophy.name} — missable` : trophy.name;
      chip.addEventListener('click', () => callbacks.onSelect(trophy.id));
      chips.append(chip);
    }
    section.append(chips);
    pane.append(section);
  }
}

function missableReason(trophy) {
  const sentences = trophy.guide.split(/(?<=[.!?])\s+/);
  return sentences.find((sentence) => sentence.startsWith('Flagged missable')) ?? trophy.guide;
}

export function renderMissables(doc, state, callbacks) {
  const pane = document.getElementById('missablesPane');
  pane.replaceChildren();
  const missables = doc.trophies.filter((trophy) => trophy.missable);
  pane.append(el('h2', undefined, 'Missable trophies'));
  pane.append(el('p', 'intro', `${missables.length} trophies are flagged missable — each needs a specific moment, setup or choice, and the official description gives no second chance. They are flagged from the descriptions alone; where a trigger is not pinned down, the guide says so. Do them when the chance comes, and check the roadmap for the order.`));
  for (const trophy of missables) {
    const card = el('article', 'missable-card');
    const body = el('div');
    body.append(el('h3', undefined, trophy.name));
    body.append(el('p', 'why', missableReason(trophy)));
    const meta = el('div', 'trophy-meta');
    meta.append(gradeBadge(trophy), kindBadge(trophy));
    body.append(meta);
    const go = el('button', 'go', state.earned.has(trophy.id) ? '✓ Earned' : 'View guide');
    go.addEventListener('click', () => callbacks.onSelect(trophy.id));
    card.append(body, go);
    pane.append(card);
  }
}
