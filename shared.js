/* shared.js — storage, helpers, progress. Loaded on every page (after data.js). */

const STORE_KEY = "cyberMathProgress.v1";

function loadState() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; }
  catch { return {}; }
}
function saveState(state) {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
  catch { /* ignore */ }
}

const state = loadState();

function isChecked(category, phaseId, itemId) {
  return !!(state[category] && state[category][phaseId] && state[category][phaseId][itemId]);
}
function setChecked(category, phaseId, itemId, val) {
  if (!state[category]) state[category] = {};
  if (!state[category][phaseId]) state[category][phaseId] = {};
  if (val) state[category][phaseId][itemId] = true;
  else delete state[category][phaseId][itemId];
  saveState(state);
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function dayRange(p) {
  return p.days[0] === p.days[1] ? "Day " + p.days[0] : "Day " + p.days[0] + "–" + p.days[1];
}
function pct(done, total) { return total === 0 ? 0 : Math.round((done / total) * 100); }

function buildPhaseItems(phase) {
  const items = [];
  if (phase.videos) phase.videos.forEach((v, i) => items.push({ id: "v" + i, label: v, sub: "video", type: "video", index: i }));
  if (phase.resources) phase.resources.forEach((r, i) => items.push({ id: "r" + i, label: r.name, sub: r.type || "resource", type: "resource", url: r.url }));
  if (phase.tasks) phase.tasks.forEach((t, i) => items.push({ id: "t" + i, label: t, sub: "task", type: "task" }));
  return items;
}

/* distribute N items across a range of days (for per-day view) */
function distributeToDays(phase, items) {
  const [start, end] = phase.days;
  const totalDays = end - start + 1;
  const dayCount = Math.max(1, Math.min(totalDays, items.length));
  const buckets = Array.from({ length: dayCount }, () => []);
  items.forEach((it, i) => {
    const b = Math.floor(i / Math.ceil(items.length / dayCount));
    const idx = Math.min(b, dayCount - 1);
    buckets[idx].push(it);
  });
  return buckets.map((list, i) => ({ day: start + i, items: list }));
}

/* ---------- progress ---------- */
function computeCategoryProgress(category, phases) {
  let done = 0, total = 0;
  phases.forEach((p) => {
    const items = buildPhaseItems(p);
    total += items.length;
    done += items.filter((it) => isChecked(category, p.id, it.id)).length;
  });
  return { done, total, pct: pct(done, total) };
}

/* SVG progress ring (donut) */
function ringSVG(p, size = 64, stroke = 6) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c - (p / 100) * c;
  return `
    <svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="${p}% selesai">
      <circle class="ring-bg" cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke-width="${stroke}"/>
      <circle class="ring-fg" cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke-width="${stroke}"
        stroke-dasharray="${c}" stroke-dashoffset="${off}" transform="rotate(-90 ${size/2} ${size/2})"/>
      <text class="ring-text" x="50%" y="50%" text-anchor="middle" dominant-baseline="central">${p}%</text>
    </svg>`;
}
