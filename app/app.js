// Leonida Trophy Guide: tracker and guide for the 55 PS5 trophies of Grand Theft Auto VI.
// Progress lives in localStorage, so ticks survive a reload and work offline. Export writes a JSON
// file of the earned trophy names; import reads one back. The spoiler setting hides the names,
// descriptions and guides of the story trophies until they are earned.
const EARNED_KEY = 'gta6-trophy-guide-earned-v1';
const SPOILER_KEY = 'gta6-trophy-guide-spoiler-v1';

const listEl = document.getElementById('trophy-list');
const emptyEl = document.getElementById('empty');
const showingEl = document.getElementById('showing');
const searchEl = document.getElementById('search');
const gradeEl = document.getElementById('grade');
const kindEl = document.getElementById('kind');
const missableEl = document.getElementById('missable-only');
const hideEarnedEl = document.getElementById('hide-earned');
const spoilerEl = document.getElementById('spoiler');

const data = await (await fetch('data/trophies.json')).json();
const roadmap = await (await fetch('data/roadmap.json')).json();
const trophies = data.trophies;
const sourceByName = new Map((data.sources || []).map((s) => [s.name, s]));

let earned = new Set(JSON.parse(localStorage.getItem(EARNED_KEY) ?? '[]'));
let openGuide = null;

function saveEarned() {
  localStorage.setItem(EARNED_KEY, JSON.stringify([...earned]));
}

function saveSpoiler() {
  localStorage.setItem(SPOILER_KEY, JSON.stringify(spoilerEl.checked));
}

function kindLabel(kind) {
  return {
    story: 'Story',
    side: 'Side story',
    collectibles: 'Collectibles',
    activities: 'Activities',
    robbery: 'Robbery',
    world: 'World & money',
    completion: '100% completion',
    platinum: 'Platinum',
  }[kind] ?? kind;
}

function isMasked(t) {
  return spoilerEl.checked && t.hidden && !earned.has(t.name);
}

function renderProgress() {
  const total = trophies.length;
  const done = earned.size;
  const pct = Math.round((done / total) * 100);
  document.getElementById('earned-count').textContent = done;
  document.getElementById('progress-label').textContent = pct + '% to the platinum';
  document.getElementById('bar-fill').style.width = pct + '%';
  const counts = document.getElementById('grade-counts');
  counts.replaceChildren();
  for (const grade of ['platinum', 'gold', 'silver', 'bronze']) {
    const ofGrade = trophies.filter((t) => t.grade === grade);
    const got = ofGrade.filter((t) => earned.has(t.name)).length;
    const li = document.createElement('li');
    const b = document.createElement('b');
    b.textContent = got + '/' + ofGrade.length;
    li.append(b, ' ' + grade);
    counts.append(li);
  }
}

function renderRoadmap() {
  const stagesEl = document.getElementById('stages');
  stagesEl.replaceChildren();
  for (const stage of roadmap.stages) {
    const li = document.createElement('li');
    const h3 = document.createElement('h3');
    const num = document.createElement('span');
    num.className = 'stage-num';
    num.textContent = 'Stage ' + stage.stage;
    h3.append(num, stage.title);
    const p = document.createElement('p');
    p.textContent = stage.text;
    li.append(h3, p);
    if (stage.trophies.length > 0) {
      const got = stage.trophies.filter((id) => {
        const t = trophies.find((x) => x.id === id);
        return t && earned.has(t.name);
      }).length;
      const count = document.createElement('span');
      count.className = 'stage-count';
      count.textContent = got + ' of ' + stage.trophies.length + ' trophies in this stage';
      li.append(count);
    }
    stagesEl.append(li);
  }
}

function badge(text, cls) {
  const span = document.createElement('span');
  span.className = 'badge ' + cls;
  span.textContent = text;
  return span;
}

function renderGuide(t, body) {
  const guide = document.createElement('div');
  guide.className = 'guide';
  const p = document.createElement('p');
  p.textContent = t.guide;
  guide.append(p);
  const sources = document.createElement('p');
  sources.className = 'sources';
  sources.append('Sources: ');
  (t.sources || []).forEach((name, i) => {
    if (i > 0) sources.append(' · ');
    const entry = sourceByName.get(name);
    if (entry && entry.url) {
      const a = document.createElement('a');
      a.href = entry.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = name;
      sources.append(a);
    } else {
      sources.append(name);
    }
  });
  guide.append(sources);
  body.append(guide);
}

function renderList() {
  const query = searchEl.value.trim().toLowerCase();
  listEl.replaceChildren();
  let shown = 0;
  for (const t of trophies) {
    if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) continue;
    if (kindEl.value !== 'all' && t.kind !== kindEl.value) continue;
    if (missableEl.checked && !t.missable) continue;
    if (hideEarnedEl.checked && earned.has(t.name)) continue;
    if (query && !(t.name.toLowerCase().includes(query) || t.description.toLowerCase().includes(query) || t.guide.toLowerCase().includes(query))) continue;
    shown += 1;

    const masked = isMasked(t);
    const li = document.createElement('li');
    li.className = 'trophy' + (earned.has(t.name) ? ' earned' : '');
    const head = document.createElement('div');
    head.className = 'trophy-head';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.name);
    box.setAttribute('aria-label', 'Mark ' + t.name + ' as earned');
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.name);
      else earned.delete(t.name);
      saveEarned();
      renderProgress();
      renderRoadmap();
      renderList();
    });
    const title = document.createElement('div');
    title.className = 'trophy-title';
    const h3 = document.createElement('h3');
    if (masked) {
      h3.textContent = 'Hidden trophy — earn it to reveal';
      h3.className = 'spoiler-hidden';
    } else {
      h3.textContent = t.name;
      if (t.missable) {
        const flag = document.createElement('span');
        flag.className = 'missable-flag';
        flag.textContent = 'Missable';
        h3.append(flag);
      }
    }
    const desc = document.createElement('p');
    desc.className = 'trophy-desc';
    desc.textContent = masked ? 'This story trophy stays hidden until you earn it.' : t.description;
    if (masked) desc.className += ' spoiler-hidden';
    title.append(h3, desc);
    const badges = document.createElement('div');
    badges.className = 'badges';
    badges.append(badge(t.grade, t.grade));
    if (t.kind !== 'platinum') badges.append(badge(kindLabel(t.kind), 'kind'));
    if (t.hidden) badges.append(badge('Hidden', 'hidden-tag'));
    head.append(box, title, badges);
    li.append(head);

    if (!masked) {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'secondary guide-toggle';
      toggle.textContent = openGuide === t.id ? 'Hide guide' : 'Read the guide';
      toggle.addEventListener('click', () => {
        openGuide = openGuide === t.id ? null : t.id;
        renderList();
      });
      li.append(toggle);
      if (openGuide === t.id) renderGuide(t, li);
    } else {
      const note = document.createElement('p');
      note.className = 'trophy-desc spoiler-hidden';
      note.textContent = 'Turn the spoiler setting off, or tick the box once you have earned it, to see its guide.';
      li.append(note);
    }
    listEl.append(li);
  }
  emptyEl.hidden = shown !== 0;
  showingEl.textContent = 'Showing ' + shown + ' of ' + trophies.length + ' trophies';
}

function renderAll() {
  renderProgress();
  renderRoadmap();
  renderList();
}

document.getElementById('export').addEventListener('click', () => {
  const payload = { game: 'Grand Theft Auto VI', platform: 'PlayStation 5', exportedAt: new Date().toISOString(), earned: [...earned] };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

document.getElementById('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const names = Array.isArray(parsed) ? parsed : parsed.earned;
    if (!Array.isArray(names)) throw new Error('no earned list');
    const known = new Set(trophies.map((t) => t.name));
    const next = new Set(names.filter((n) => known.has(n)));
    earned = next;
    saveEarned();
    renderAll();
  } catch {
    alert('That file is not a trophy progress export from this guide.');
  }
  e.target.value = '';
});

document.getElementById('reset').addEventListener('click', () => {
  if (confirm('Clear every ticked trophy? This cannot be undone.')) {
    earned = new Set();
    saveEarned();
    renderAll();
  }
});

for (const el of [searchEl, gradeEl, kindEl, missableEl, hideEarnedEl]) {
  el.addEventListener(el.tagName === 'INPUT' && el.type !== 'checkbox' ? 'input' : 'change', renderList);
}
spoilerEl.addEventListener('change', () => {
  saveSpoiler();
  renderList();
});

const savedSpoiler = localStorage.getItem(SPOILER_KEY);
if (savedSpoiler !== null) spoilerEl.checked = JSON.parse(savedSpoiler);
renderAll();
