/* math.js — mathematics track logic (playlists, no day filter) */

const CATEGORY = "math";
let openPhase = null;

function renderHeaderStats() {
  const p = computeCategoryProgress(CATEGORY, MATH_PLAYLISTS);
  document.getElementById("headerStats").innerHTML = `
    <span class="stat-pill stat-pill--math">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M8 5v4M16 5v4"/><path d="M4 15h16M8 13v4M16 13v4"/></svg>
      <b>${p.pct}%</b>
    </span>`;
}

function renderRing() {
  const p = computeCategoryProgress(CATEGORY, MATH_PLAYLISTS);
  document.getElementById("mathRing").innerHTML = ringSVG(p.pct);
  document.getElementById("mathNum").textContent = p.pct + "%";
}

function renderGraph() {
  const container = document.getElementById("mathGraph");
  const html = MATH_PLAYLISTS.map((p, idx) => {
    const items = buildPhaseItems(p);
    const done = items.filter((it) => isChecked(CATEGORY, p.id, it.id)).length;
    const total = items.length;
    const stateCls = done === total && total > 0 ? "is-done" : done > 0 ? "is-active" : "";
    const isOpen = openPhase === p.id;
    return `
      <button class="node node--math ${stateCls} ${isOpen ? "is-open" : ""}" data-phase="${esc(p.id)}" aria-expanded="${isOpen}">
        <span class="node-num">${String(idx + 1).padStart(2, "0")}</span>
        <span class="node-icon" aria-hidden="true">${esc(p.icon)}</span>
        <span class="node-body">
          <span class="node-name">${esc(p.name)}</span>
          <span class="node-range">${total} video · ${pct(done, total)}%</span>
        </span>
        <span class="node-chev" aria-hidden="true">▾</span>
      </button>`;
  }).join("");
  container.innerHTML = html;
  container.querySelectorAll(".node").forEach((el) => {
    el.addEventListener("click", () => togglePhase(el.dataset.phase));
  });
}

function renderAccordion() {
  const container = document.getElementById("mathAccordion");
  if (!openPhase) { container.innerHTML = ""; return; }
  const phase = MATH_PLAYLISTS.find((p) => p.id === openPhase);
  if (!phase) { container.innerHTML = ""; return; }

  const items = buildPhaseItems(phase);
  const done = items.filter((it) => isChecked(CATEGORY, phase.id, it.id)).length;

  const checklistHTML = `<ul class="checklist">${items.map((it, i) => {
    const checked = isChecked(CATEGORY, phase.id, it.id);
    return `
      <li class="check-item ${checked ? "is-done" : ""}">
        <input type="checkbox" data-pid="${esc(phase.id)}" data-iid="${esc(it.id)}" ${checked ? "checked" : ""} />
        <span class="check-num">${String(i + 1).padStart(2, "0")}</span>
        <div class="check-body">
          <span class="check-label">${esc(it.label)}</span>
        </div>
      </li>`;
  }).join("")}</ul>`;

  container.innerHTML = `
    <div class="accordion-panel open">
      <div class="acc-head">
        <div class="acc-head-left">
          <span class="acc-icon" aria-hidden="true">${esc(phase.icon)}</span>
          <div>
            <div class="acc-title">${esc(phase.name)}</div>
            <div class="acc-sub">${items.length} video · ${done} selesai</div>
          </div>
        </div>
        <a class="acc-playlist" href="${esc(phase.url)}" target="_blank" rel="noopener">Buka playlist ↗</a>
      </div>
      <div class="acc-sub-progress">
        <div class="progress-bar"><span style="width:${pct(done, items.length)}%"></span></div>
      </div>
      <div class="acc-body">${checklistHTML}</div>
    </div>`;

  container.querySelectorAll("input[type=checkbox]").forEach((cb) => {
    cb.addEventListener("change", () => {
      setChecked(CATEGORY, cb.dataset.pid, cb.dataset.iid, cb.checked);
      cb.closest(".check-item").classList.toggle("is-done", cb.checked);
      refreshProgress();
    });
  });
}

function togglePhase(id) {
  openPhase = openPhase === id ? null : id;
  renderGraph();
  renderAccordion();
}

function refreshProgress() {
  renderHeaderStats();
  renderRing();
  renderGraph();
}

function refresh() {
  renderHeaderStats();
  renderRing();
  renderGraph();
  renderAccordion();
}

document.getElementById("exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "cybermath-progress.json";
  a.click();
  URL.revokeObjectURL(a.href);
});

document.getElementById("importBtn").addEventListener("click", () => {
  document.getElementById("importFile").click();
});
document.getElementById("importFile").addEventListener("change", (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const incoming = JSON.parse(reader.result);
      Object.keys(state).forEach((k) => delete state[k]);
      Object.assign(state, incoming);
      saveState(state);
      refresh();
      alert("Progres berhasil diimpor.");
    } catch {
      alert("File tidak valid.");
    }
    e.target.value = "";
  };
  reader.readAsText(f);
});

document.getElementById("resetBtn").addEventListener("click", () => {
  if (confirm("Reset seluruh progres matematika?")) {
    delete state[CATEGORY];
    saveState(state);
    openPhase = null;
    refresh();
  }
});

refresh();
