/* ==========================================================
   FIELD BUDDY PRO v5.0 – ELITE EDITION
   Application Core (ES Modules)
   Author: Martín Pérez | Fidelity Mechanical Solutions
   ========================================================== */

/* ------------------ DOM HELPERS ------------------ */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const pages = {
  dashboard: $('#dashboard-page'),
  service:   $('#service-page'),
  materials: $('#materials-page'),
  ductdesign:$('#ductdesign-page'),
  cfm:       $('#cfm-page'),
  reports:   $('#reports-page'),
};

const pageTitleEl = $('#page-title');
const sidebar = $('#sidebar');

/* ------------------ STATE ------------------ */
const STATE = {
  reports: loadFromStorage('fbp_reports', []),
  materials: [],
  tech: {
    name: 'Martín Pérez'
  }
};

/* ------------------ NAVIGATION ------------------ */
window.switchPage = (name) => {
  Object.values(pages).forEach(p => p?.classList.add('hidden'));
  const id = `${name}-page`;
  const el = pages[name] || $(`#${id}`);
  if (el) el.classList.remove('hidden');

  pageTitleEl.textContent = ({
    dashboard: 'Dashboard',
    service: 'Service Calls',
    materials: 'Materials Catalog',
    ductdesign: 'Duct Design',
    cfm: 'CFM Calculator',
    reports: 'Reports & History'
  }[name]) || 'Field Buddy Pro';

  // update active nav item
  $$('.nav-item').forEach(n => n.classList.remove('active'));
  const nav = $(`.nav-item[onclick="switchPage('${name}')"]`);
  if (nav) nav.classList.add('active');

  if (name === 'materials' && STATE.materials.length === 0) {
    bootstrapMaterials();
  }
};

function toggleMobileMenu() {
  sidebar?.classList.toggle('mobile-open');
}
window.toggleMobileMenu = toggleMobileMenu;

/* ------------------ STORAGE ------------------ */
function saveToStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function loadFromStorage(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

/* ------------------ TOAST ------------------ */
function toast(msg, type = 'info', timeout = 2500) {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 300);
  }, timeout);
}

/* Style hook for toast (kept here to avoid adding CSS file dependencies) */
const style = document.createElement('style');
style.textContent = `
.toast{position:fixed;bottom:24px;right:24px;background:var(--glass-bg);
color:#fff;padding:12px 16px;border-radius:12px;border:1px solid var(--glass-border);
opacity:0;transform:translateY(10px);transition:.25s;backdrop-filter:blur(18px);z-index:9999}
.toast.show{opacity:1;transform:translateY(0)}
.toast.info{border-color:#3b82f6}
.toast.success{border-color:#10b981}
.toast.warn{border-color:#f59e0b}
.toast.error{border-color:#ef4444}`;
document.head.appendChild(style);

/* ------------------ SERVICE REPORTS ------------------ */
window.saveServiceReport = () => {
  const name = $('#customer-name')?.value?.trim();
  const addr = $('#service-address')?.value?.trim();
  const complaint = $('#customer-complaint')?.value?.trim();

  if (!name || !addr) {
    toast('Please enter customer name and address', 'warn');
    return;
  }

  const report = {
    id: `R${Date.now()}`,
    date: new Date().toISOString(),
    tech: STATE.tech.name,
    customer: { name, addr },
    complaint,
  };

  STATE.reports.unshift(report);
  saveToStorage('fbp_reports', STATE.reports);
  toast('Report saved', 'success');
  renderReportsList();
};

/* ------------------ REPORTS: RENDER & EXPORT ------------------ */
function renderReportsList() {
  const container = $('#reports-page .card-body');
  if (!container) return;

  if (!STATE.reports.length) {
    container.innerHTML = `<p style="color:var(--text-secondary)">No reports saved yet.</p>
    <button class="btn btn-primary" onclick="exportAllReports()">Export All (PDF)</button>`;
    return;
  }

  container.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <div style="font-weight:700">Saved Reports (${STATE.reports.length})</div>
      <div>
        <button class="btn btn-secondary" onclick="clearReports()">Clear</button>
        <button class="btn btn-primary" onclick="exportAllReports()">Export All (PDF)</button>
      </div>
    </div>
    <div id="reports-list"></div>
  `;

  const list = $('#reports-list');
  list.innerHTML = STATE.reports.map(r => `
    <div class="card" style="margin-bottom:12px">
      <div class="card-body">
        <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;">
          <div>
            <div style="font-weight:700">${r.customer.name}</div>
            <div style="color:var(--text-secondary);font-size:13px">${r.customer.addr}</div>
          </div>
          <div style="text-align:right;min-width:160px">
            <div style="font-size:13px;color:var(--text-secondary)">${new Date(r.date).toLocaleString()}</div>
            <div style="font-size:13px;">Tech: ${r.tech}</div>
          </div>
        </div>
        ${r.complaint ? `<div style="margin-top:8px;color:var(--text-tertiary)">${escapeHTML(r.complaint)}</div>` : ''}
        <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-secondary" onclick="exportReport('${r.id}')">Export PDF</button>
          <button class="btn btn-danger" onclick="deleteReport('${r.id}')">Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}

window.deleteReport = (id) => {
  STATE.reports = STATE.reports.filter(r => r.id !== id);
  saveToStorage('fbp_reports', STATE.reports);
  renderReportsList();
  toast('Report deleted', 'success');
};

window.clearReports = () => {
  if (!confirm('Delete all saved reports?')) return;
  STATE.reports = [];
  saveToStorage('fbp_reports', STATE.reports);
  renderReportsList();
  toast('All reports cleared', 'success');
};

window.exportReport = async (id) => {
  const r = STATE.reports.find(x => x.id === id);
  if (!r) return toast('Report not found', 'error');

  try {
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) throw new Error('jsPDF not loaded');

    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Field Buddy Pro — Service Report', 14, 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const y0 = 28;
    doc.text(`Report ID: ${r.id}`, 14, y0);
    doc.text(`Date: ${new Date(r.date).toLocaleString()}`, 14, y0 + 7);
    doc.text(`Technician: ${r.tech}`, 14, y0 + 14);
    doc.text(`Customer: ${r.customer.name}`, 14, y0 + 21);
    doc.text(`Address: ${r.customer.addr}`, 14, y0 + 28);

    if (r.complaint) {
      doc.setFont('helvetica', 'bold');
      doc.text('Complaint:', 14, y0 + 40);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(r.complaint, 180);
      doc.text(lines, 14, y0 + 47);
    }

    doc.save(`${safeFileName(r.customer.name)}_${r.id}.pdf`);
    toast('PDF exported', 'success');
  } catch (err) {
    console.error(err);
    toast('PDF export failed', 'error');
  }
};

window.exportAllReports = async () => {
  if (!STATE.reports.length) return toast('No reports to export', 'warn');
  for (const r of STATE.reports.slice(0, 25)) {
    await window.exportReport(r.id);
  }
};

/* ------------------ MATERIALS: LOAD & RENDER ------------------ */
async function bootstrapMaterials() {
  try {
    const res = await fetch('data/materials.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('materials.json not found');
    const data = await res.json();
    STATE.materials = data.categories || [];
    renderMaterials();
  } catch (err) {
    console.error(err);
    $('#materials-container').innerHTML = `
      <div class="card">
        <div class="card-body">
          <div style="color:var(--text-secondary)">Could not load materials catalog. Create <code>data/materials.json</code> to enable this feature.</div>
        </div>
      </div>
    `;
  }
}

function renderMaterials() {
  const root = $('#materials-container');
  if (!root) return;

  if (!STATE.materials.length) {
    root.innerHTML = `<p style="color:var(--text-secondary)">No materials found.</p>`;
    return;
  }

  root.innerHTML = `
    <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:12px;">
      <input id="mat-search" placeholder="Search materials..." style="max-width:320px"/>
      <button class="btn btn-secondary" onclick="resetMaterialSelection()">Reset</button>
      <button class="btn btn-primary" onclick="exportMaterialList()">Export Selected</button>
    </div>
    <div id="mat-list"></div>
    <div class="card mt-lg">
      <div class="card-header"><div class="card-title">Selected Items</div></div>
      <div class="card-body" id="mat-selected">Nothing selected.</div>
    </div>
  `;

  const list = $('#mat-list');
  list.innerHTML = STATE.materials.map(cat => `
    <div class="card">
      <div class="card-header">
        <div class="card-title">${cat.name} <span style="color:var(--text-tertiary);font-size:12px">(${cat.items.length})</span></div>
      </div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;">
          ${cat.items.map(it => materialCard(it, cat.name)).join('')}
        </div>
      </div>
    </div>
  `).join('');

  $('#mat-search').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    $$('#mat-list .mat-card').forEach(card => {
      const text = card.dataset.text;
      card.style.display = text.includes(q) ? '' : 'none';
    });
  });

  // Render selection if any
  renderSelectedMaterials();
}

function materialCard(item, category) {
  const id = `${category}::${item.name}`;
  return `
    <div class="mat-card card" data-id="${escapeAttr(id)}" data-text="${escapeAttr((item.name + ' ' + (item.spec || '')).toLowerCase())}">
      <div class="card-body">
        <div style="font-weight:700">${item.name}</div>
        ${item.spec ? `<div style="color:var(--text-secondary);font-size:13px">${item.spec}</div>` : ''}
        <div style="display:flex;gap:8px;align-items:center;margin-top:10px;">
          <input type="number" min="0" value="0" style="max-width:90px" oninput="updateMaterialQty('${escapeJS(id)}', this.value)" />
          <button class="btn btn-secondary" onclick="addOneMaterial('${escapeJS(id)}')">+1</button>
          <button class="btn btn-danger" onclick="removeMaterial('${escapeJS(id)}')">Remove</button>
        </div>
      </div>
    </div>
  `;
}

/* Selection store in memory only (simple) */
const MAT_SELECTED = new Map();

window.addOneMaterial = (id) => {
  const qty = MAT_SELECTED.get(id) || 0;
  MAT_SELECTED.set(id, qty + 1);
  renderSelectedMaterials();
};

window.updateMaterialQty = (id, v) => {
  const qty = Math.max(0, Number(v) || 0);
  if (qty === 0) MAT_SELECTED.delete(id);
  else MAT_SELECTED.set(id, qty);
  renderSelectedMaterials();
};

window.removeMaterial = (id) => {
  MAT_SELECTED.delete(id);
  renderSelectedMaterials();
};

function renderSelectedMaterials() {
  const target = $('#mat-selected');
  if (!target) return;
  if (!MAT_SELECTED.size) {
    target.innerHTML = 'Nothing selected.';
    return;
  }

  target.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;">
      ${Array.from(MAT_SELECTED.entries()).map(([id, qty]) => {
        const [cat, name] = id.split('::');
        return `
          <div class="card">
            <div class="card-body" style="display:flex;justify-content:space-between;gap:12px;align-items:center;">
              <div>
                <div style="font-weight:700">${name}</div>
                <div style="color:var(--text-secondary);font-size:12px">${cat}</div>
              </div>
              <div style="display:flex;gap:8px;align-items:center;">
                <input type="number" min="0" value="${qty}" style="width:90px" oninput="updateMaterialQty('${escapeJS(id)}', this.value)" />
                <button class="btn btn-danger" onclick="removeMaterial('${escapeJS(id)}')">✕</button>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

window.resetMaterialSelection = () => {
  MAT_SELECTED.clear();
  renderSelectedMaterials();
  toast('Selection cleared', 'success');
};

window.exportMaterialList = () => {
  if (!MAT_SELECTED.size) return toast('No items selected', 'warn');
  const lines = ['Field Buddy Pro — Material Takeoff', `Date: ${new Date().toLocaleString()}`, ''];
  for (const [id, qty] of MAT_SELECTED.entries()) {
    const [cat, name] = id.split('::');
    lines.push(`${qty} × ${name}  —  ${cat}`);
  }
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Material_Takeoff_${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  toast('Material list exported', 'success');
};

/* ------------------ DUCT DESIGN (BASIC LAYOUT) ------------------ */
window.generateDuctDesign = () => {
  const sqft = Number($('#cfm-sqft')?.value || 0) || 2400;
  const tonnage = Number($('#cfm-tonnage')?.value || 0) || 5;
  const cfmTarget = Math.round(tonnage * 400); // standard nominal

  // three sub-plenums split — tweakable ratios
  const splits = [0.4, 0.35, 0.25];
  const branches = splits.map((r, i) => ({
    name: `Sub-Plenum ${i + 1}`,
    cfm: Math.round(cfmTarget * r),
    trunk: suggestTrunk(Math.round(cfmTarget * r))
  }));

  const out = [
    `CFM Target: ~${cfmTarget} CFM (tonnage × 400)`,
    `Square Footage (ref): ${sqft} sqft`,
    '',
    'Feeder → Sub-Plenums:',
    ...branches.map(b => `  • ${b.name} → ${b.cfm} CFM → Suggest trunk: ${b.trunk}`),
    '',
    'Notes:',
    '  • Keep ESP ≤ 0.50 in.w.c., friction rate ≈ 0.08 in.w.c./100ft',
    '  • Use smooth radius elbows, avoid hard boots where possible',
    '  • Balance dampers at sub-plenums; keep velocities < 900 FPM in trunks'
  ].join('\n');

  $('#duct-output').textContent = out;
  toast('Duct layout generated', 'success');
};

function suggestTrunk(cfm) {
  // very simplified lookup using typical round duct velocities ~700-900 FPM
  // A = CFM / V ; round duct diameter from area
  const V = 800;
  const area = cfm / V; // ft^2
  const diaInches = Math.sqrt((area * 144) / Math.PI) * 2; // inches
  const round = Math.max(8, Math.round(diaInches / 2) * 2); // even inches, min 8"
  return `${round}" round (~${Math.round(cfm)} CFM @ ~${V} FPM)`;
}

/* ------------------ CFM CALCULATOR ------------------ */
window.calculateCFM = () => {
  const sqft = Number($('#cfm-sqft')?.value || 0);
  const tons = Number($('#cfm-tonnage')?.value || 0);

  if (!tons && !sqft) {
    toast('Enter square footage or tonnage', 'warn');
    return;
  }

  const nominal = tons ? tons * 400 : Math.round(sqft * 0.8); // 0.8 CFM/sqft rough planning rule
  const low = Math.round(nominal * 0.875);
  const high = Math.round(nominal * 1.05);

  $('#cfm-result').textContent = `Target airflow ≈ ${nominal} CFM (range ${low} – ${high} CFM).`;
  toast('CFM calculated', 'success');
};

/* ------------------ UTIL ------------------ */
function escapeHTML(s = '') {
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
function escapeAttr(s=''){ return escapeHTML(String(s)); }
function escapeJS(s=''){ return String(s).replace(/'/g,"\\'"); }
function safeFileName(s=''){ return s.replace(/[^a-z0-9_-]+/gi,'_'); }

/* ------------------ INIT ------------------ */
function initNavClicks() {
  // ensure touch devices can open sidebar
  document.addEventListener('click', (e) => {
    if (e.target.closest('.menu-toggle')) toggleMobileMenu();
  });
}

function init() {
  initNavClicks();
  renderReportsList();
  // default page
  switchPage('dashboard');
}

document.addEventListener('DOMContentLoaded', init);
