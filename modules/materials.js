/* ==========================================================
   FIELD BUDDY PRO v5.0 – ELITE EDITION
   Materials Module (ESM)
   Author: Martín Pérez | Fidelity Mechanical Solutions
   ----------------------------------------------------------
   Purpose:
     Portable helpers for rendering, filtering, and exporting
     the HVAC materials catalog. This module is optional —
     `app.js` can work without it, but these utilities let you
     add pricing, SKUs, vendor data, and richer exports later.

   Exports:
     - normalizeCatalog(raw)
     - searchCatalog(catalog, query)
     - flatten(catalog)
     - mergeSelections(selectionsA, selectionsB)
     - formatSelectedForText(selections)
     - extendWithPricing(catalog, priceMap)
     - summarizeSelectionCost(selections, priceMap)
     - sortCategories(catalog, order)
     - sortItemsInCategory(catalog, compareFn)
   ========================================================== */

/* ------------------ Types (informal) ------------------
Catalog:
{
  version: "2025.11",
  categories: [
    { name: "Category", items: [ { name, spec, sku?, price? }, ... ] },
    ...
  ]
}

Selections Map (object form for portability):
{
  "Category::Item Name": quantityNumber,
  ...
}
-------------------------------------------------------- */

/** Coerce and validate a raw catalog object into a stable form. */
export function normalizeCatalog(raw) {
  const safe = {
    version: String(raw?.version || ''),
    categories: []
  };

  const cats = Array.isArray(raw?.categories) ? raw.categories : [];
  for (const c of cats) {
    const name = toStr(c?.name);
    if (!name) continue;
    const items = Array.isArray(c?.items) ? c.items : [];
    const normItems = items
      .map(i => ({
        name: toStr(i?.name),
        spec: toStr(i?.spec),
        sku: toStr(i?.sku),
        price: toNumOrNull(i?.price)
      }))
      .filter(i => i.name);
    if (!normItems.length) continue;
    safe.categories.push({ name, items: normItems });
  }

  return safe;
}

/** Full-text search (name + spec) across all items. */
export function searchCatalog(catalog, query) {
  const q = toStr(query).trim().toLowerCase();
  if (!q) return catalog;
  const out = { version: catalog.version, categories: [] };

  for (const c of catalog.categories) {
    const items = c.items.filter(it => {
      const hay = (it.name + ' ' + (it.spec || '') + ' ' + (it.sku || '')).toLowerCase();
      return hay.includes(q);
    });
    if (items.length) out.categories.push({ name: c.name, items });
  }
  return out;
}

/** Flatten catalog to an array of { id, category, name, spec, sku?, price? } */
export function flatten(catalog) {
  const rows = [];
  for (const c of catalog.categories) {
    for (const it of c.items) {
      rows.push({
        id: `${c.name}::${it.name}`,
        category: c.name,
        name: it.name,
        spec: it.spec || '',
        sku: it.sku || '',
        price: isFinite(it.price) ? Number(it.price) : null
      });
    }
  }
  return rows;
}

/** Merge two selection objects (summing quantities). */
export function mergeSelections(a = {}, b = {}) {
  const out = { ...a };
  for (const [id, qty] of Object.entries(b)) {
    const n = clampInt(qty);
    if (!n) continue;
    out[id] = clampInt((out[id] || 0) + n);
    if (!out[id]) delete out[id];
  }
  return out;
}

/** Produce a plain-text takeoff from a selection object. */
export function formatSelectedForText(selections = {}) {
  const lines = [];
  const entries = Object.entries(selections).filter(([, q]) => q && q > 0);
  if (!entries.length) return 'Nothing selected.';

  lines.push('Field Buddy Pro — Material Takeoff');
  lines.push(`Date: ${new Date().toLocaleString()}`);
  lines.push('');

  // Sort by category then name for readability
  entries.sort((a, b) => a[0].localeCompare(b[0]));
  for (const [id, qty] of entries) {
    const [cat, name] = splitId(id);
    lines.push(`${qty} × ${name}  —  ${cat}`);
  }
  return lines.join('\n');
}

/**
 * Attach per-item pricing using a map:
 *   priceMap: { "Category::Item Name": 12.34, ... }
 * Returns a new catalog; does not mutate original.
 */
export function extendWithPricing(catalog, priceMap = {}) {
  const out = { version: catalog.version, categories: [] };
  for (const c of catalog.categories) {
    const items = c.items.map(it => {
      const id = `${c.name}::${it.name}`;
      const p = toNumOrNull(priceMap[id]);
      return { ...it, price: isFinite(p) ? p : it.price ?? null };
    });
    out.categories.push({ name: c.name, items });
  }
  return out;
}

/**
 * Summarize cost of a selection using a price map
 * Returns { lines: string[], subtotal: number, missingPrices: string[] }
 */
export function summarizeSelectionCost(selections = {}, priceMap = {}) {
  const lines = [];
  let subtotal = 0;
  const missingPrices = [];

  const entries = Object.entries(selections).filter(([, q]) => q && q > 0);
  entries.sort((a, b) => a[0].localeCompare(b[0]));

  for (const [id, qty] of entries) {
    const price = toNumOrNull(priceMap[id]);
    const [cat, name] = splitId(id);

    if (!isFinite(price)) {
      missingPrices.push(id);
      lines.push(`${qty} × ${name} — ${cat} : $N/A`);
      continue;
    }

    const lineTotal = +(qty * price).toFixed(2);
    subtotal += lineTotal;
    lines.push(`${qty} × ${name} — ${cat} : $${price.toFixed(2)}  →  $${lineTotal.toFixed(2)}`);
  }

  return {
    lines,
    subtotal: +subtotal.toFixed(2),
    missingPrices
  };
}

/** Sort category order by a preferred names array (others appended after). */
export function sortCategories(catalog, preferredOrder = []) {
  const order = new Map(preferredOrder.map((n, i) => [n, i]));
  const cats = [...catalog.categories];
  cats.sort((a, b) => {
    const ia = order.has(a.name) ? order.get(a.name) : Number.MAX_SAFE_INTEGER;
    const ib = order.has(b.name) ? order.get(b.name) : Number.MAX_SAFE_INTEGER;
    return ia - ib || a.name.localeCompare(b.name);
  });
  return { version: catalog.version, categories: cats };
}

/** Sort items inside each category using a comparator (e.g., alphabetical). */
export function sortItemsInCategory(catalog, compareFn = (a, b) => a.name.localeCompare(b.name)) {
  const out = { version: catalog.version, categories: [] };
  for (const c of catalog.categories) {
    const items = [...c.items].sort(compareFn);
    out.categories.push({ name: c.name, items });
  }
  return out;
}

/* ------------------ Helpers ------------------ */
function toStr(v) {
  return (v === null || v === undefined) ? '' : String(v);
}
function toNumOrNull(v) {
  const n = Number(v);
  return isFinite(n) ? n : null;
}
function splitId(id = '') {
  const idx = id.indexOf('::');
  if (idx === -1) return ['', id];
  return [id.slice(0, idx), id.slice(idx + 2)];
}
function clampInt(n) {
  const x = Math.round(Number(n) || 0);
  return x < 0 ? 0 : x;
}

/* ------------------ Default Export ------------------ */
export default {
  normalizeCatalog,
  searchCatalog,
  flatten,
  mergeSelections,
  formatSelectedForText,
  extendWithPricing,
  summarizeSelectionCost,
  sortCategories,
  sortItemsInCategory
};
