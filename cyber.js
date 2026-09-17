/* cyber.js — cybersecurity track logic */

const CATEGORY = "cyber";
let viewMode = "material"; // "material" | "day"
let openPhase = null;

function renderHeaderStats() {
  const p = computeCategoryProgress(CATEGORY, CYBER_PHASES);
  document.getElementById("headerStats").innerHTML = `
    <span class="stat-pill stat-pill--cyber">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 L20 6 V11 C20 16 16.5 19.5 12 21 C7.5 19.5 4 16 4 11 V6 Z"/><path d="M9 11 L11 13 L15 9"/></svg>
      <b>${p.pct}%</b>
    </span>`;
}

function renderRing() {
  const p = computeCategoryProgress(CATEGORY, CYBER_PHASES);
  document.getElementById("cyberRing").innerHTML = ringSVG(p.pct);
  document.getElementById("cyberNum").textContent = p.pct + "%";
  document.getElementById("cyberNum").textContent += "";
}

function renderGraph() {
  const container = document.getElementById("cyberGraph");
  const html = CYBER_PHASES.map((p, idx) => {
    const items = buildPhaseItems(p);
    const done = items.filter((it) => isChecked(CATEGORY, p.id, it.id)).length;
    const total = items.length;
    const stateCls = done === total && total > 0 ? "is-done" : done > 0 ? "is-active" : "";
    const isOpen = openPhase === p.id;
    return `
      <button class="node node--cyber ${stateCls} ${isOpen ? "is-open" : ""}" data-phase="${esc(p.id)}" aria-expanded="${isOpen}">
        <span class="node-num">${String(idx + 1).padStart(2, "0")}</span>
        <span class="node-icon" aria-hidden="true">${esc(p.icon)}</span>
        <span class="node-body">
          <span class="node-name">${esc(p.name)}</span>
          <span class="node-range">${esc(dayRange(p))} · ${pct(done, total)}%</span>
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
  const container = document.getElementById("cyberAccordion");
  if (!openPhase) {
    container.innerHTML = "";
    return;
  }
  const phase = CYBER_PHASES.find((p) => p.id === openPhase);
  if (!phase) { container.innerHTML = ""; return; }

  const items = buildPhaseItems(phase);
  const done = items.filter((it) => isChecked(CATEGORY, phase.id, it.id)).length;

  function checklistHTML(list) {
    if (!list.length) return `<p class="empty-note">Belum ada item.</p>`;
    return `<ul class="checklist">${list.map((it) => {
      const checked = isChecked(CATEGORY, phase.id, it.id);
      const typeLabel = it.type === "video" ? "🎬" : it.type === "resource" ? "🔗" : "✅";
      const link = it.url ? `<a class="check-link" href="${esc(it.url)}" target="_blank" rel="noopener">buka ↗</a>` : "";
      return `
        <li class="check-item ${checked ? "is-done" : ""}">
          <input type="checkbox" data-pid="${esc(phase.id)}" data-iid="${esc(it.id)}" ${checked ? "checked" : ""} />
          <span class="check-type" aria-hidden="true">${typeLabel}</span>
          <div class="check-body">
            <span class="check-label">${esc(it.label)}</span>
            ${link ? `<span class="check-link-wrap">${link}</span>` : ""}
          </div>
        </li>`;
    }).join("")}</ul>`;
  }

  let bodyHTML;
  if (viewMode === "day" && phase.days) {
    const buckets = distributeToDays(phase, items);
    bodyHTML = buckets.map((b) => {
      const bDone = b.items.filter((it) => isChecked(CATEGORY, phase.id, it.id)).length;
      return `
        <div class="day-group">
          <div class="day-head">
            <span class="day-title">Day ${b.day}</span>
            <span class="day-count">${bDone}/${b.items.length}</span>
          </div>
          ${checklistHTML(b.items)}
        </div>`;
    }).join("");
  } else {
    bodyHTML = checklistHTML(items);
  }

  container.innerHTML = `
    <div class="accordion-panel open">
      <div class="acc-head">
        <div class="acc-head-left">
          <span class="acc-icon" aria-hidden="true">${esc(phase.icon)}</span>
          <div>
            <div class="acc-title">${esc(phase.name)}</div>
            <div class="acc-sub">${esc(dayRange(phase))} · ${done}/${items.length} selesai</div>
          </div>
        </div>
        <div class="acc-sub-progress">
          <div class="progress-bar"><span style="width:${pct(done, items.length)}%"></span></div>
        </div>
      </div>
      <div class="acc-body">${bodyHTML}</div>
    </div>`;

  container.querySelectorAll("input[type=checkbox]").forEach((cb) => {
    cb.addEventListener("change", () => {
      setChecked(CATEGORY, cb.dataset.pid, cb.dataset.iid, cb.checked);
      // update UI state without destroying the open checklist
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

/* update ring + header + graph only (keeps open accordion intact) */
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

/* view toggle */
document.querySelectorAll(".view-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    viewMode = btn.dataset.view;
    document.querySelectorAll(".view-btn").forEach((b) => {
      b.classList.toggle("is-active", b === btn);
      b.setAttribute("aria-selected", b === btn ? "true" : "false");
    });
    renderAccordion();
  });
});

/* export / import */
document.getElementById("exportBtn").addEventListener("click", () => {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: "application/json" });
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
  if (confirm("Reset seluruh progres cybersecurity?")) {
    delete state[CATEGORY];
    saveState(state);
    openPhase = null;
    refresh();
  }
});

refresh();
