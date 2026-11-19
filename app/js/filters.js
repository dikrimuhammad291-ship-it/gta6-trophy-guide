// Filtering and the spoiler rule: which trophies a view shows, and what a
// spoiler-free reader is allowed to see of the story ones.

export const KIND_LABELS = {
  platinum: 'Platinum',
  story: 'Story',
  mission: 'Mission',
  side: 'Side strand',
  collectible: 'Collectible',
  activity: 'Activity',
  combat: 'Combat',
  misc: 'Misc',
};

// A trophy is spoiler-hidden when the spoiler setting is on, the trophy is a
// story or mission trophy, and the reader has not earned it yet. Earned story
// trophies are no longer spoilers.
export function spoilerHidesTrophy(trophy, spoilerOn, earned) {
  if (!spoilerOn) return false;
  if (earned.has(trophy.id)) return false;
  return trophy.kind === 'story' || trophy.kind === 'mission';
}

export function applyFilters(trophies, filters, earned) {
  const query = filters.query.trim().toLowerCase();
  return trophies.filter((trophy) => {
    if (filters.kind !== 'all' && trophy.kind !== filters.kind) return false;
    if (filters.grade !== 'all' && trophy.grade !== filters.grade) return false;
    if (filters.status === 'earned' && !earned.has(trophy.id)) return false;
    if (filters.status === 'remaining' && earned.has(trophy.id)) return false;
    if (filters.status === 'missable' && !trophy.missable) return false;
    if (query) {
      const haystack = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}

// The next trophy in roadmap order the reader has not earned yet.
export function nextUnearnedTrophy(trophies, roadmap, earned) {
  for (const stage of roadmap) {
    for (const id of stage.trophies) {
      if (!earned.has(id)) return trophies.find((trophy) => trophy.id === id) ?? null;
    }
  }
  return null;
}

export function gradeCounts(trophies, earned) {
  const counts = { platinum: [0, 0], gold: [0, 0], silver: [0, 0], bronze: [0, 0] };
  for (const trophy of trophies) {
    counts[trophy.grade][1] += 1;
    if (earned.has(trophy.id)) counts[trophy.grade][0] += 1;
  }
  return counts;
}
