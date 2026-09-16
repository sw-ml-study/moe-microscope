// Landscape player: a generic panning stage over pinned recordings.
// It knows scenes, stations, chips, and lanes; the meaning of a chip is in
// the scenes file's captions. Every value drawn is read from a recording.
'use strict';

const SCENES_PATH = 'fixtures/landscape/scenes-v0.json';
const SEGMENT = 960;
const STATION_Y = 156;

const state = { scenes: null, recordings: {}, index: 0, timer: null, report: [], reduced: false };
const $ = (id) => document.getElementById(id);
const fmt = (v) => (Number.isInteger(v) ? String(v) : (Math.abs(v) >= 100 ? v.toFixed(1) : v.toFixed(3)));

function reshape(values, shape) {
  if (shape.length <= 1) return values;
  const [r, c] = shape;
  const rows = [];
  for (let i = 0; i < r; i++) rows.push(values.slice(i * c, (i + 1) * c));
  return rows;
}

async function loadRecording(path) {
  if (!state.recordings[path]) {
    const res = await fetch(path);
    if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
    state.recordings[path] = await res.json();
  }
  return state.recordings[path];
}

// A read names a recording, an observation, and a frame index; it returns the observation or records an error.
function read(scene, r) {
  const path = r.recording || scene.recording;
  const rec = state.recordings[path];
  const frame = rec && rec.frames[r.frame];
  const o = frame && frame.observations.find((x) => x.name === r.name);
  if (!o) {
    state.report.push({ scene: scene.id, error: `missing ${r.name} at frame ${r.frame} of ${path}` });
    return null;
  }
  state.report.push({ scene: scene.id, name: o.name, shape: o.shape, frame: r.frame, step: frame.step, recording: path, sample: o.values.slice(0, 6).map(fmt) });
  return o;
}

function recordingsOf(scene) {
  const out = new Set();
  if (scene.recording) out.add(scene.recording);
  (scene.chips || []).forEach((c) => { if (c.read && c.read.recording) out.add(c.read.recording); if (c.labelsFrom && c.labelsFrom.recording) out.add(c.labelsFrom.recording); });
  return [...out];
}

function labelFor(scene, chip, id) {
  const map = state.scenes.labels && state.scenes.labels[chip.label];
  if (typeof map === 'string') return map[id] === ' ' ? 'sp' : (map[id] || String(id));
  if (Array.isArray(map)) return map[id] || String(id);
  return String(id);
}

// Chip builders: each returns a list of {html, cls, from, to, lane} from one observation.
const BUILDERS = {
  token(scene, chip, o) {
    const n = Math.min(chip.count || o.values.length, o.values.length);
    return o.values.slice(0, n).map((id, i) => ({
      html: `<b>${labelFor(scene, chip, id)}</b><small>${fmt(id)}</small>`, cls: 'c-token', from: chip.from, to: chip.to, index: i,
    }));
  },
  vector(scene, chip, o) {
    const rows = reshape(o.values, o.shape);
    const n = Math.min(chip.count || rows.length, rows.length);
    const peak = Math.max(...o.values.map(Math.abs), 1e-9);
    return rows.slice(0, n).map((row, i) => ({
      html: `<span class="cells">${row.map((v) => `<i style="opacity:${(0.15 + 0.85 * Math.abs(v) / peak).toFixed(2)}" title="${fmt(v)}"></i>`).join('')}</span><small>${fmt(row[0])} .. ${fmt(row[row.length - 1])}</small>`,
      cls: 'c-vector', from: chip.from, to: chip.to, index: i,
    }));
  },
  score(scene, chip, o) {
    const label = (i) => (chip.labelsAt ? labelFor(scene, chip, chip.labelsAt[i]) : (chip.items ? chip.items[i] : ''));
    const cell = (v, i, pass) => ({ html: `<em style="width:${Math.round(100 * Math.min(1, Math.abs(v)))}%"></em><small>${label(i)}${label(i) ? ' ' : ''}${fmt(v)}</small>`, cls: 'c-score', from: chip.from, to: chip.to, index: i, pass });
    if (chip.byRow && o.shape.length > 1) {
      const out = [];
      reshape(o.values, o.shape).forEach((row, r) => row.forEach((v, i) => out.push(cell(v, i, r))));
      return out;
    }
    const rows = o.shape.length > 1 ? reshape(o.values, o.shape) : o.values.map((v) => [v]);
    const n = Math.min(chip.count || rows.length, rows.length);
    const col = chip.col || 0;
    return rows.slice(0, n).map((row, i) => cell(row[col], i, 0));
  },
  matrix(scene, chip, o) {
    const rows = reshape(o.values, o.shape);
    const peak = Math.max(...o.values.map(Math.abs), 1e-9);
    const html = `<table class="mini">${rows.map((row) => `<tr>${row.map((v) => `<td style="opacity:${(0.15 + 0.85 * Math.abs(v) / peak).toFixed(2)}" title="${fmt(v)}"></td>`).join('')}</tr>`).join('')}</table><small>${chip.label || o.name}</small>`;
    return [{ html, cls: 'c-matrix', from: chip.from, to: chip.to, index: 0 }];
  },
  rows(scene, chip, o) {
    const rows = reshape(o.values, o.shape);
    const n = Math.min(chip.count || rows.length, rows.length);
    const out = [];
    rows.slice(0, n).forEach((row, i) => row.forEach((v, j) => out.push({ html: `<b>${fmt(v)}</b><small>${chip.tags ? chip.tags[j] : j}</small>`, cls: 'c-row', from: chip.from, to: chip.to, index: i * row.length + j })));
    return out;
  },
  group(scene, chip, o) {
    const n = Math.min(chip.count || o.values.length, o.values.length);
    const labels = chip.labelsFrom ? read(scene, chip.labelsFrom) : null;
    return o.values.slice(0, n).map((g, i) => ({
      html: `<b>${labels ? labelFor(scene, chip, labels.values[i]) : i}</b><small>${fmt(g)}</small>`, cls: `c-token lane${g}`, from: chip.from, to: chip.lanes[g] || chip.to, index: i,
    }));
  },
  strip(scene, chip, o) {
    const rows = reshape(o.values, o.shape);
    const out = [];
    rows.forEach((row, r) => row.forEach((v, i) => out.push({ html: `<b>${chip.prefix || ''}${fmt(v)}</b><small>${chip.labelsAt ? labelFor(scene, chip, chip.labelsAt[i]) : i}</small>`, cls: `c-token lane${Number.isInteger(v) ? v : 0}`, from: chip.from, to: (chip.lanes && chip.lanes[v]) || chip.to, index: i, pass: r })));
    return out;
  },
};

function stationX(scene, id) {
  const i = scene.stations.findIndex((s) => s.id === id);
  return 40 + Math.max(0, i) * Math.floor((SEGMENT - 80) / Math.max(1, scene.stations.length));
}

function renderScene(scene, k) {
  const seg = document.createElement('section');
  seg.className = 'segment' + (scene.placeholder ? ' placeholder' : '');
  seg.style.left = `${k * SEGMENT}px`;
  seg.dataset.scene = scene.id;
  let inner = `<h2>${k + 1}. ${scene.title}</h2><p class="caption">${scene.caption}</p>`;
  (scene.lanes || []).forEach((l) => { inner += `<div class="lane ${l.above ? 'above' : 'below'}"><span>${l.label}</span></div>`; });
  scene.stations.forEach((s) => { inner += `<div class="station" style="left:${stationX(scene, s.id)}px;top:${STATION_Y}px" data-station="${s.id}"><span>${s.label}</span></div>`; });
  seg.innerHTML = inner;
  const chips = [];
  // Each chip group gets a band below the stations; horizontal kinds take one slot per index, the vector kind stacks one row per index.
  let band = 0;
  (scene.chips || []).forEach((chip) => {
    const o = read(scene, chip.read);
    if (!o) return;
    const built = (BUILDERS[chip.kind] || BUILDERS.token)(scene, chip, o);
    const vertical = chip.kind === 'vector' || chip.kind === 'matrix';
    const slotW = { token: 44, group: 44, score: 56, rows: 46, strip: 44 }[chip.kind] || 44;
    const baseY = STATION_Y + 64 + band;
    // Arrivals pack by their order within the destination station and pass, so a far-right lane never runs off the segment.
    const perDest = {};
    built.forEach((c) => { const key = `${c.to}|${c.pass || 0}`; perDest[key] = (perDest[key] || 0) + 1; c.slot = perDest[key] - 1; });
    built.forEach((c) => {
      const el = document.createElement('div');
      el.className = `chip ${c.cls}`;
      el.innerHTML = c.html;
      const dx = vertical ? 0 : c.index * slotW;
      const dy = vertical ? c.index * 18 : (c.pass || 0) * 48;
      el.style.left = `${stationX(scene, c.from) + dx}px`;
      el.style.top = `${baseY + dy}px`;
      el.dataset.to = String(stationX(scene, c.to) + (vertical ? 0 : (c.from === c.to ? dx : c.slot * slotW)));
      el.dataset.delay = String(((c.pass || 0) * 14 + c.index) * 90);
      seg.appendChild(el);
      chips.push(el);
    });
    const rowsUsed = vertical ? built.length : 1 + Math.max(0, ...built.map((c) => c.pass || 0));
    band += chip.kind === 'matrix' ? 130 : (vertical ? built.length * 18 + 12 : rowsUsed * 48 + 8);
  });
  if (scene.placeholder) seg.innerHTML += '<div class="ph">no recording yet: nothing moves here</div>';
  return { seg, chips };
}

function play(sceneIndex) {
  const scene = state.scenes.scenes[sceneIndex];
  const seg = document.querySelector(`.segment[data-scene="${scene.id}"]`);
  if (!seg) return;
  seg.querySelectorAll('.chip').forEach((el) => {
    const go = () => { el.style.left = `${el.dataset.to}px`; el.classList.add('arrived'); };
    if (state.reduced) go(); else setTimeout(go, Number(el.dataset.delay));
  });
}

function goTo(i) {
  state.index = Math.max(0, Math.min(state.scenes.scenes.length - 1, i));
  $('track').style.transform = `translateX(${-state.index * SEGMENT}px)`;
  $('scene').value = String(state.index);
  $('slider').value = String(state.index);
  $('scene-label').textContent = `scene ${state.index + 1} of ${state.scenes.scenes.length}`;
  play(state.index);
}

function stop() { if (state.timer) { clearInterval(state.timer); state.timer = null; $('play').textContent = 'Play'; } }

function renderReport() {
  const lines = [];
  state.scenes.scenes.forEach((s) => {
    const rows = state.report.filter((r) => r.scene === s.id);
    const errs = rows.filter((r) => r.error);
    lines.push(`${s.id}: ${rows.length - errs.length} reads, ${errs.length} errors`);
    rows.forEach((r) => lines.push(r.error ? `  ERROR ${r.error}` : `  ${r.name} [${r.shape.join(', ')}] frame ${r.frame} step ${r.step} of ${r.recording}: ${r.sample.join(' ')}`));
  });
  $('verify').hidden = false;
  $('verify').textContent = lines.join('\n');
  document.title = state.report.some((r) => r.error) ? 'verified: errors' : 'verified: ok';
}

async function main() {
  state.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches || new URLSearchParams(location.search).get('motion') === 'off';
  try {
    const bi = await fetch('build-info.json');
    if (bi.ok) { const b = await bi.json(); $('build-info').textContent = `${b.host} · ${b.sha} · ${b.timestamp}`; }
  } catch (e) { /* the footer keeps its default text */ }
  const res = await fetch(SCENES_PATH);
  state.scenes = await res.json();
  for (const s of state.scenes.scenes) { for (const path of recordingsOf(s)) await loadRecording(path); }
  const track = $('track');
  track.style.width = `${state.scenes.scenes.length * SEGMENT}px`;
  state.scenes.scenes.forEach((s, k) => { track.appendChild(renderScene(s, k).seg); });
  const sel = $('scene');
  state.scenes.scenes.forEach((s, k) => { const o = document.createElement('option'); o.value = String(k); o.textContent = `${k + 1}. ${s.title}`; sel.appendChild(o); });
  $('slider').max = String(state.scenes.scenes.length - 1);
  sel.addEventListener('change', () => { stop(); goTo(Number(sel.value)); });
  $('slider').addEventListener('input', () => { stop(); goTo(Number($('slider').value)); });
  $('prev').addEventListener('click', () => { stop(); goTo(state.index - 1); });
  $('next').addEventListener('click', () => { stop(); goTo(state.index + 1); });
  $('play').addEventListener('click', () => {
    if (state.timer) { stop(); return; }
    $('play').textContent = 'Pause';
    state.timer = setInterval(() => { if (state.index >= state.scenes.scenes.length - 1) stop(); else goTo(state.index + 1); }, state.reduced ? 1500 : 4000);
  });
  const params = new URLSearchParams(location.search);
  goTo(Number(params.get('scene') || 0));
  if (params.get('verify') === '1') renderReport();
}

main().catch((e) => { $('scene-label').textContent = `error: ${e.message}`; document.title = 'verified: errors'; });
