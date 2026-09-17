/* ==========================================================================
   Cyber·Math Academy — app logic
   - Renders clickable graph nodes (buttons) with prerequisite arrows
   - Renders per-day / per-playlist checklists
   - Persists progress to localStorage (works on Android + laptop)
   ========================================================================== */

const STORE_KEY = "cyberMathProgress.v1";

/* ---------- storage ---------- */
function loadState() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
function saveState(state) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    /* storage full / private mode — fail silently */
  }
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

/* ---------- helpers ---------- */
function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
function dayRange(p) {
  return p.days[0] === p.days[1] ? `Day ${p.days[0]}` : `Day ${p.days[0]}–${p.days[1]}`;
}
function pct(done, total) {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

/* ---------- build item list for a phase ---------- */
// Returns array of { id, label, sub, url, type }
function buildPhaseItems(phase) {
  const items = [];
  if (phase.videos) {
    phase.videos.forEach((v, i) => {
      items.push({
        id: "v" + i,
        label: v,
        sub: phase.playlist ? "Video " + (i + 1) + " · " + phase.playlist.title : "Video " + (i + 1),
        url: phase.playlist ? phase.playlist.url : null,
        type: "video",
      });
    });
  }
  if (phase.resources) {
    phase.resources.forEach((r, i) => {
      items.push({
        id: "r" + i,
        label: r.name,
        sub: r.type ? r.type : "resource",
        url: r.url,
        type: "resource",
      });
    });
  }
  if (phase.tasks) {
    phase.tasks.forEach((t, i) => {
      items.push({
        id: "t" + i,
        label: t,
        sub: "hands-on task",
        url: null,
        type: "task",
      });
    });
  }
  return items;
}

/* ---------- graph rendering ---------- */
function renderGraph(container, phases, category, activePhaseId, onSelect) {
  const doneIds = new Set();
  const activeIds = new Set();

  phases.forEach((p, idx) => {
    const items = buildPhaseItems(p);
    const done = items.filter((it) => isChecked(category, p.id, it.id)).length;
    if (done === items.length && items.length > 0) doneIds.add(p.id);
    else if (done > 0) activeIds.add(p.id);
  });

  const html = phases.map((p, idx) => {
    const items = buildPhaseItems(p);
    const done = items.filter((it) => isChecked(category, p.id, it.id)).length;
    const total = items.length;
    const cls = [
      "node",
      category === "cyber" ? "node--cyber" : "node--math",
      done === total && total > 0 ? "is-done" : done > 0 ? "is-active" : "",
    ].join(" ");
    const range = category === "cyber" ? dayRange(p) : total + " video";
    const arrow = idx < phases.length - 1
      ? `<span class="node-arrow" aria-hidden="true">→</span>`
      : "";
    return `
      <button class="${cls}" data-phase="${esc(p.id)}" data-index="${idx}" aria-pressed="${activePhaseId === p.id}">
        <span class="node-num">${String(idx + 1).padStart(2, "0")}</span>
        <span class="node-icon" aria-hidden="true">${esc(p.icon || "")}</span>
        <span class="node-body">
          <span class="node-name">${esc(p.name)}</span>
          <span class="node-range">${esc(range)}${total ? " · " + pct(done, total) + "%" : ""}</span>
        </span>
        ${arrow}
      </button>`;
  }).join("");

  container.innerHTML = html;
  container.querySelectorAll(".node").forEach((el) => {
    el.addEventListener("click", () => onSelect(el.dataset.phase));
  });
}

/* ---------- checklist rendering ---------- */
function renderDetail(container, category, phase, onClose) {
  const items = buildPhaseItems(phase);
  const done = items.filter((it) => isChecked(category, phase.id, it.id)).length;
  const total = items.length;
  const progress = pct(done, total);

  const videoItems = items.filter((it) => it.type === "video");
  const taskItems = items.filter((it) => it.type === "task" || it.type === "resource");

  const icon = phase.icon || (category === "cyber" ? "🛡️" : "📐");
  const rangeLabel = category === "cyber"
    ? dayRange(phase)
    : "Playlist · " + total + " video";

  function renderChecklist(list) {
    if (!list.length) return `<p class="empty-note">Tidak ada item pada bagian ini.</p>`;
    return `<ul class="checklist">${list.map((it) => {
      const checked = isChecked(category, phase.id, it.id);
      const typeLabel = it.type === "video" ? "🎬 video" : it.type === "resource" ? "🔗 resource" : "✅ task";
      const link = it.url ? `<a class="check-link" href="${esc(it.url)}" target="_blank" rel="noopener">Buka materi ↗</a>` : "";
      return `
        <li class="check-item ${checked ? "is-done" : ""}">
          <input type="checkbox" id="${esc(category)}-${esc(phase.id)}-${esc(it.id)}" data-pid="${esc(phase.id)}" data-iid="${esc(it.id)}" ${checked ? "checked" : ""} />
          <label class="check-body" for="${esc(category)}-${esc(phase.id)}-${esc(it.id)}">
            <span class="check-label">${esc(it.label)}</span>
            <span class="check-sub">${esc(typeLabel)}${it.sub ? " · " + esc(it.sub) : ""}</span>
            ${link ? `<br><span class="check-link-wrap">${link}</span>` : ""}
          </label>
        </li>`;
    }).join("")}</ul>`;
  }

  container.innerHTML = `
    <div class="detail-head">
      <div class="detail-head-left">
        <span class="detail-icon" aria-hidden="true">${esc(icon)}</span>
        <div>
          <div class="detail-title">${esc(phase.name)}</div>
          <div class="detail-sub">${esc(rangeLabel)}</div>
        </div>
      </div>
      <button class="detail-close" data-close>Tutup ✕</button>
    </div>
    <div class="detail-desc">${esc(phase.desc || "")}</div>
    ${phase.playlist ? `
      <div class="detail-section">
        <h4>Sumber utama</h4>
        <p style="margin:6px 0 0;">
          <a href="${esc(phase.playlist.url)}" target="_blank" rel="noopener">${esc(phase.playlist.title)} ↗</a>
        </p>
      </div>` : ""}
    <div class="detail-section">
      <h4>Video &amp; materi</h4>
      <div class="sub-progress">
        <div class="progress-bar"><span style="width:${progress}%"></span></div>
        <span class="sub-progress-label">${done}/${total} · ${progress}%</span>
      </div>
      ${renderChecklist(videoItems)}
    </div>
    ${taskItems.length ? `
    <div class="detail-section">
      <h4>Tugas &amp; referensi tambahan</h4>
      ${renderChecklist(taskItems)}
    </div>` : ""}
  `;

  container.classList.add("open");
  container.scrollIntoView({ behavior: "smooth", block: "nearest" });

  container.querySelectorAll("input[type=checkbox]").forEach((cb) => {
    cb.addEventListener("change", () => {
      setChecked(category, cb.dataset.pid, cb.dataset.iid, cb.checked);
      refreshAll();
    });
  });

  container.querySelector("[data-close]").addEventListener("click", () => {
    container.classList.remove("open");
    if (onClose) onClose();
  });
}

/* ---------- progress summaries ---------- */
function computeCategoryProgress(category, phases) {
  let done = 0, total = 0;
  phases.forEach((p) => {
    const items = buildPhaseItems(p);
    total += items.length;
    done += items.filter((it) => isChecked(category, p.id, it.id)).length;
  });
  return { done, total, pct: pct(done, total) };
}

function renderProgress() {
  const cyber = computeCategoryProgress("cyber", CYBER_PHASES);
  const math = computeCategoryProgress("math", MATH_PLAYLISTS);
  const overall = pct(cyber.done + math.done, cyber.total + math.total);

  document.getElementById("headerStats").innerHTML = `
    <span class="stat-pill">🛡️ <b>${cyber.pct}%</b> Cyber</span>
    <span class="stat-pill">📐 <b>${math.pct}%</b> Math</span>
    <span class="stat-pill">⭐ <b>${overall}%</b> Total</span>
  `;

  document.getElementById("cyberMeta").textContent =
    `${cyber.done}/${cyber.total} item selesai · ${cyber.pct}%`;
  document.getElementById("mathMeta").textContent =
    `${math.done}/${math.total} video selesai · ${math.pct}%`;

  const setPanelProgress = (elId, p) => {
    document.getElementById(elId).innerHTML = `
      <div class="progress-ring-label">Progres keseluruhan</div>
      <div class="progress-big">${p.pct}<small>%</small></div>
      <div class="progress-bar"><span style="width:${p.pct}%"></span></div>
      <div class="progress-ring-label" style="margin-top:4px">${p.done}/${p.total} item</div>
    `;
  };
  setPanelProgress("cyberProgress", cyber);
  setPanelProgress("mathProgress", math);
}

/* ---------- main render ---------- */
let activeCyber = null;
let activeMath = null;

function refreshAll() {
  renderProgress();
  renderGraph(
    document.getElementById("cyberGraph"),
    CYBER_PHASES,
    "cyber",
    activeCyber,
    (id) => {
      activeCyber = activeCyber === id ? null : id;
      if (activeCyber) {
        const phase = CYBER_PHASES.find((p) => p.id === activeCyber);
        renderDetail(document.getElementById("cyberDetail"), "cyber", phase, () => { activeCyber = null; });
      } else {
        document.getElementById("cyberDetail").classList.remove("open");
        document.getElementById("cyberDetail").innerHTML = "";
      }
      renderGraph(document.getElementById("cyberGraph"), CYBER_PHASES, "cyber", activeCyber, () => {});
    }
  );

  renderGraph(
    document.getElementById("mathGraph"),
    MATH_PLAYLISTS,
    "math",
    activeMath,
    (id) => {
      activeMath = activeMath === id ? null : id;
      if (activeMath) {
        const phase = MATH_PLAYLISTS.find((p) => p.id === activeMath);
        renderDetail(document.getElementById("mathDetail"), "math", phase, () => { activeMath = null; });
      } else {
        document.getElementById("mathDetail").classList.remove("open");
        document.getElementById("mathDetail").innerHTML = "";
      }
      renderGraph(document.getElementById("mathGraph"), MATH_PLAYLISTS, "math", activeMath, () => {});
    }
  );
}

/* ---------- events ---------- */
document.querySelectorAll(".track-card").forEach((card) => {
  card.addEventListener("click", () => {
    const target = card.dataset.track;
    document.getElementById(target).scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

document.getElementById("resetBtn").addEventListener("click", () => {
  if (confirm("Reset seluruh progres belajar? Tindakan ini tidak bisa dibatalkan.")) {
    localStorage.removeItem(STORE_KEY);
    Object.keys(state).forEach((k) => delete state[k]);
    activeCyber = null;
    activeMath = null;
    document.getElementById("cyberDetail").classList.remove("open");
    document.getElementById("mathDetail").classList.remove("open");
    refreshAll();
  }
});

/* ---------- boot ---------- */
refreshAll();
