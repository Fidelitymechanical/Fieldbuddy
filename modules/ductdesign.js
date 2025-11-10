/* ==========================================================
   FIELD BUDDY PRO v5.0 – ELITE EDITION
   Duct Design Module (ESM)
   Author: Martín Pérez | Fidelity Mechanical Solutions
   ----------------------------------------------------------
   Purpose:
     Lightweight, field-ready helpers for sub-plenum and branch
     sizing, with velocity checks and friction-rate rough-ins.
     Designed to support residential/light commercial layouts.

   All flows are CFM. Velocities are FPM. Dimensions are inches.
   Ranges reflect common ACCA Manual D heuristics used in the field.

   Exports:
     - splitCFM(totalCFM, ratios|counts)
     - sizeRoundDuct(cfm, targetFPM=800, minDia=6, maxDia=24, even=true)
     - sizeRectDuct(cfm, targetFPM=800, aspect=2, minW=6, minH=6)
     - trunkSuggestion(cfm, fpm=800)
     - branchSuggestion(cfm, fpm=700)
     - velocity(cfm, areaFt2)
     - areaRound(diaIn) / areaRect(w,h)
     - frictionRateQuick(totalESP, eql, drops)
     - equivalentLength(segments)
     - returnSizing(totalCFM, maxFaceVel=500)
     - supplyRegisterSizing(cfm, maxFaceVel=500)
     - generateSubPlenumPlan(totalCFM, split=[0.4,0.35,0.25], trunkFPM=800, branchFPM=700)
     - formatPlanText(plan)
   ========================================================== */

/* ------------------ Core Math ------------------ */
const PI = Math.PI;

export function areaRound(diaIn) {
  const r = (diaIn / 2) / 12; // ft
  return PI * r * r;          // ft²
}

export function areaRect(wIn, hIn) {
  return (wIn / 12) * (hIn / 12); // ft²
}

export function velocity(cfm, areaFt2) {
  if (!isFinite(cfm) || !isFinite(areaFt2) || areaFt2 <= 0) return null;
  return +(cfm / areaFt2).toFixed(0); // FPM
}

/* ------------------ CFM Splitting ------------------ */
/**
 * Split total CFM by ratios (array sum ≈ 1) or by equal counts (number).
 * Returns an array of integers that sum to totalCFM.
 */
export function splitCFM(totalCFM, ratiosOrCount) {
  if (!isFinite(totalCFM) || totalCFM <= 0) return [];
  let parts = [];

  if (Array.isArray(ratiosOrCount)) {
    const sum = ratiosOrCount.reduce((a, b) => a + (Number(b) || 0), 0) || 1;
    parts = ratiosOrCount.map(r => Math.round((Number(r) || 0) / sum * totalCFM));
  } else if (Number.isInteger(ratiosOrCount) && ratiosOrCount > 0) {
    const base = Math.floor(totalCFM / ratiosOrCount);
    const rem = totalCFM - base * ratiosOrCount;
    parts = Array.from({ length: ratiosOrCount }, (_, i) => base + (i < rem ? 1 : 0));
  }

  // Normalize rounding errors
  const diff = totalCFM - parts.reduce((a, b) => a + b, 0);
  if (diff !== 0 && parts.length) parts[0] += diff;

  return parts;
}

/* ------------------ Sizing Helpers ------------------ */
/**
 * Round duct selector by target FPM (default 800 FPM trunks, 700 branches)
 * Returns { dia, fpm, areaFt2 }
 */
export function sizeRoundDuct(
  cfm,
  targetFPM = 800,
  minDia = 6,
  maxDia = 24,
  even = true
) {
  if (!isFinite(cfm) || cfm <= 0) return null;

  // Initial diameter guess from A = Q / V → D = sqrt(4A/π)
  const area = cfm / targetFPM; // ft²
  let dia = Math.sqrt((area * 144 * 4) / PI); // inches

  // Round to practical sizes
  dia = even ? Math.round(dia / 2) * 2 : Math.round(dia);
  dia = Math.max(minDia, Math.min(maxDia, dia));

  const aFt2 = areaRound(dia);
  const fpm = velocity(cfm, aFt2);
  return { dia, fpm, areaFt2: +aFt2.toFixed(3) };
}

/**
 * Rectangular duct picker by aspect ratio (W:H), default 2:1
 * Returns { w, h, fpm, areaFt2 }
 */
export function sizeRectDuct(
  cfm,
  targetFPM = 800,
  aspect = 2,
  minW = 6,
  minH = 6
) {
  if (!isFinite(cfm) || cfm <= 0) return null;
  const area = cfm / targetFPM; // ft²
  // area = (W/12)*(H/12) with W = aspect*H ⇒ H = sqrt(area*144 / aspect)
  let h = Math.sqrt((area * 144) / (aspect || 1));
  let w = aspect * h;

  // Round to nearest whole inch
  h = Math.max(minH, Math.round(h));
  w = Math.max(minW, Math.round(w));

  const aFt2 = areaRect(w, h);
  const fpm = velocity(cfm, aFt2);
  return { w, h, fpm, areaFt2: +aFt2.toFixed(3) };
}

/** Friendly trunk suggestion string, defaults to round */
export function trunkSuggestion(cfm, fpm = 800) {
  const r = sizeRoundDuct(cfm, fpm, 8, 24, true);
  if (!r) return 'n/a';
  return `${r.dia}" round @ ~${r.fpm} FPM`;
}

/** Friendly branch suggestion (defaults to round @ 700 FPM) */
export function branchSuggestion(cfm, fpm = 700) {
  const r = sizeRoundDuct(cfm, fpm, 6, 16, true);
  if (!r) return 'n/a';
  return `${r.dia}" round @ ~${r.fpm} FPM`;
}

/* ------------------ Friction & EQL ------------------ */
/**
 * Quick friction rate (in w.c./100ft).
 * totalESP: available static pressure (e.g., 0.50)
 * eql: total equivalent length of longest run (ft)
 * drops: other component drops (coil, filter, accessories)
 */
export function frictionRateQuick(totalESP = 0.5, eql = 150, drops = 0.2) {
  if (!isFinite(totalESP) || !isFinite(eql) || eql <= 0) return null;
  const avail = totalESP - drops;
  const fr = (avail / eql) * 100; // in w.c./100ft
  return +fr.toFixed(3);
}

/**
 * Equivalent length accumulator.
 * segments: array of { type, lengthFt, k? }
 * If k factor is provided, we convert to equivalent feet.
 * Returns total EQL (ft).
 */
export function equivalentLength(segments = []) {
  // Simple library of typical equivalent lengths (ft) when k not supplied.
  const EQL_LIB = {
    'elbow-90-smooth': 15,
    'elbow-45-smooth': 7,
    'wye-branch': 10,
    'boot': 10,
    'flex-per-ft': 2, // flex penalty
    'damper': 5
  };

  let total = 0;
  for (const s of segments) {
    const len = Number(s.lengthFt) || 0;
    if (!s.type) {
      total += len;
      continue;
    }

    // If caller passed a k factor use it, else add lib penalty + length.
    const lib = EQL_LIB[s.type] || 0;
    total += len + lib;
  }
  return Math.max(0, Math.round(total));
}

/* ------------------ Returns & Registers ------------------ */
/**
 * Return size target based on grille face velocity.
 * Returns { areaFt2, grilleSizes: [...], note }
 */
export function returnSizing(totalCFM, maxFaceVel = 500) {
  if (!isFinite(totalCFM) || totalCFM <= 0) return null;
  const areaFt2 = totalCFM / maxFaceVel;
  // Offer common options
  const options = [
    [20, 25], [24, 24], [16, 25], [14, 30], [12, 36]
  ].map(([w, h]) => {
    const a = areaRect(w, h);
    const v = velocity(totalCFM, a);
    return { w, h, fpm: v, faceAreaFt2: +a.toFixed(3) };
  });

  // Rank by closeness to target velocity
  options.sort((a, b) => Math.abs(maxFaceVel - a.fpm) - Math.abs(maxFaceVel - b.fpm));
  return {
    areaFt2: +areaFt2.toFixed(3),
    grilleSizes: options,
    note: `Aim for ≤ ${maxFaceVel} FPM across return filter/grille to control noise and drop.`
  };
}

/**
 * Supply register selector (simple face velocity screen).
 * Returns best fit sizes for typical ceiling supplies.
 */
export function supplyRegisterSizing(cfm, maxFaceVel = 500) {
  if (!isFinite(cfm) || cfm <= 0) return [];
  const catalog = [
    [4, 10], [4, 12], [6, 10], [6, 12]
  ];
  const options = catalog.map(([w, h]) => {
    const area = areaRect(w, h);
    return { w, h, fpm: velocity(cfm, area), faceAreaFt2: +area.toFixed(3) };
  });
  return options.sort((a, b) => Math.abs(maxFaceVel - a.fpm) - Math.abs(maxFaceVel - b.fpm));
}

/* ------------------ Plan Generator ------------------ */
/**
 * Generate a sub-plenum plan with trunks and suggested branch sizes.
 * split: either ratios (sum≈1) or a number of equal splits
 * Returns a structured object ready to render or export.
 */
export function generateSubPlenumPlan(
  totalCFM,
  split = [0.4, 0.35, 0.25],
  trunkFPM = 800,
  branchFPM = 700
) {
  const cfm = Math.round(Number(totalCFM) || 0);
  if (cfm <= 0) return null;

  const parts = splitCFM(cfm, split);
  const subs = parts.map((cfmSub, idx) => {
    const trunk = sizeRoundDuct(cfmSub, trunkFPM, 8, 24, true);
    // As a starting point: assume 5 branches per sub-plenum
    const branchCount = 5;
    const branchesCFM = splitCFM(cfmSub, branchCount);
    const branches = branchesCFM.map((q, i) => {
      const pick = sizeRoundDuct(q, branchFPM, 6, 16, true);
      return {
        name: `B${idx + 1}.${i + 1}`,
        cfm: q,
        suggestion: `${pick.dia}" round @ ~${pick.fpm} FPM`,
        dia: pick.dia,
        fpm: pick.fpm
      };
    });

    return {
      name: `Sub-Plenum ${idx + 1}`,
      cfm: cfmSub,
      trunk: {
        suggestion: `${trunk.dia}" round @ ~${trunk.fpm} FPM`,
        dia: trunk.dia,
        fpm: trunk.fpm
      },
      branches
    };
  });

  // Quick returns guidance
  const returns = returnSizing(cfm, 450);

  return {
    totalCFM: cfm,
    trunkFPM,
    branchFPM,
    subPlenums: subs,
    returns
  };
}

/**
 * Nicely formatted text block for the generated plan.
 */
export function formatPlanText(plan) {
  if (!plan) return 'No plan generated.';
  const lines = [];
  lines.push(`Total CFM: ${plan.totalCFM} (Trunk target ~${plan.trunkFPM} FPM, Branch target ~${plan.branchFPM} FPM)`);
  lines.push('');
  lines.push('Sub-Plenums:');
  plan.subPlenums.forEach(sp => {
    lines.push(`  • ${sp.name} — ${sp.cfm} CFM — Trunk: ${sp.trunk.suggestion}`);
    sp.branches.forEach(b => {
      lines.push(`      - ${b.name}: ${b.cfm} CFM → ${b.suggestion}`);
    });
  });
  if (plan.returns) {
    lines.push('');
    lines.push(`Returns: target face area ≈ ${plan.returns.areaFt2} ft²`);
    const best = plan.returns.grilleSizes.slice(0, 3)
      .map(g => `${g.w}×${g.h} @ ~${g.fpm} FPM`)
      .join(', ');
    lines.push(`  Options: ${best}`);
    if (plan.returns.note) lines.push(`  Note: ${plan.returns.note}`);
  }
  lines.push('');
  lines.push('Notes: keep ESP ≤ 0.50 in.w.c., friction rate ≈ 0.08 in.w.c./100 ft on design run, balance at sub-plenums, limit flex, and use smooth radius fittings.');

  return lines.join('\n');
}

/* ------------------ Default Export ------------------ */
export default {
  splitCFM,
  sizeRoundDuct,
  sizeRectDuct,
  trunkSuggestion,
  branchSuggestion,
  velocity,
  areaRound,
  areaRect,
  frictionRateQuick,
  equivalentLength,
  returnSizing,
  supplyRegisterSizing,
  generateSubPlenumPlan,
  formatPlanText
};
