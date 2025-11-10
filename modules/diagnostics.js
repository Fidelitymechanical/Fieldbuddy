/* ==========================================================
   FIELD BUDDY PRO v5.0 – ELITE EDITION
   Diagnostics Module (ESM)
   Author: Martín Pérez | Fidelity Mechanical Solutions
   ----------------------------------------------------------
   Exports:
     - calcDeltaT(returnF, supplyF)
     - psigToSaturationTemp(psig, refrigerant)
     - calcSuperheat(suctionPsig, suctionLineTempF, refrigerant)
     - calcSubcool(liquidPsig, liquidLineTempF, refrigerant)
     - evaluateCoolingHealth({ deltaT, superheat, subcool, meteringDevice })
     - airflowByTonnage(tons)
     - frictionRate(totalESP, supplyDrop, returnDrop, totalEQL)
     - suggestChargeAdjust({ superheat, subcool, meteringDevice, targetSubcool, targetSH })
     - targetsFor(refrigerant, meteringDevice)
   Notes:
     - Includes compact PT lookups with linear interpolation for R-410A, R-22, R-454B, R-32.
     - All temps in °F, pressures in PSIG, lengths in feet.
   ========================================================== */

/* ------------------ Compact PT Tables (°F vs PSIG) ------------------
   These are simplified “tech-range” lookups centered on residential AC.
   Interpolation is used between points. Values are approximate and intended
   for field guidance, not factory commissioning.
------------------------------------------------------------------------ */

const PT_TABLES = {
  R410A: [
    // [PSIG, °F sat]
    [90,  26], [110, 33], [130, 39], [150, 45], [170, 50], [190, 55],
    [210, 60], [230, 64], [250, 68], [275, 73], [300, 77], [325, 81],
    [350, 85]
  ],
  R22: [
    [50,  28], [60, 33], [70, 38], [80, 42], [90, 46], [100, 50],
    [110, 54], [120, 57], [130, 60], [150, 66], [170, 71], [190, 76]
  ],
  R454B: [
    [90,  22], [110, 29], [130, 35], [150, 41], [170, 46], [190, 51],
    [210, 56], [230, 60], [250, 64], [275, 69], [300, 73], [325, 77]
  ],
  R32: [
    [90,  16], [110, 22], [130, 28], [150, 33], [170, 38], [190, 43],
    [210, 47], [230, 51], [250, 55], [275, 60], [300, 64], [325, 67]
  ]
};

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

function interpolatePT(psig, table) {
  // Linear interpolation across table bounds.
  const p = psig;
  const t = table;
  if (p <= t[0][0]) return t[0][1];
  if (p >= t[t.length - 1][0]) return t[t.length - 1][1];
  for (let i = 0; i < t.length - 1; i++) {
    const [p1, f1] = t[i];
    const [p2, f2] = t[i + 1];
    if (p >= p1 && p <= p2) {
      const r = (p - p1) / (p2 - p1);
      return f1 + r * (f2 - f1);
    }
  }
  return t[0][1]; // fallback (shouldn’t hit)
}

/* ------------------ Public API ------------------ */

/** Return/Supply delta-T (°F) */
export function calcDeltaT(returnF, supplyF) {
  if (!isFinite(returnF) || !isFinite(supplyF)) return null;
  return +(returnF - supplyF).toFixed(1);
}

/** Convert PSIG → saturation temp (°F) for given refrigerant */
export function psigToSaturationTemp(psig, refrigerant = 'R410A') {
  const ref = (refrigerant || 'R410A').toUpperCase();
  const table =
    PT_TABLES[ref] ||
    PT_TABLES['R410A'];
  return +interpolatePT(psig, table).toFixed(1);
}

/** Superheat = Suction Line Temp – Evap Sat Temp (from suction PSIG) */
export function calcSuperheat(suctionPsig, suctionLineTempF, refrigerant = 'R410A') {
  if (!isFinite(suctionPsig) || !isFinite(suctionLineTempF)) return null;
  const evapSatF = psigToSaturationTemp(suctionPsig, refrigerant);
  return +(suctionLineTempF - evapSatF).toFixed(1);
}

/** Subcool = Condenser Sat Temp (from liquid PSIG) – Liquid Line Temp */
export function calcSubcool(liquidPsig, liquidLineTempF, refrigerant = 'R410A') {
  if (!isFinite(liquidPsig) || !isFinite(liquidLineTempF)) return null;
  const condSatF = psigToSaturationTemp(liquidPsig, refrigerant);
  return +(condSatF - liquidLineTempF).toFixed(1);
}

/** Nominal airflow by tonnage (rule-of-thumb) */
export function airflowByTonnage(tons) {
  if (!isFinite(tons)) return null;
  const nominal = tons * 400;          // base
  const low = Math.round(nominal * 0.875);
  const high = Math.round(nominal * 1.05);
  return { nominal: Math.round(nominal), low, high };
}

/**
 * Friction Rate (in w.c. per 100 ft)
 * totalESP = available system ESP (not including coil/filter, if already dropped)
 * supplyDrop/returnDrop = expected component losses (coil, filter, accessories)
 * totalEQL = total equivalent length (ft)
 */
export function frictionRate(totalESP, supplyDrop = 0, returnDrop = 0, totalEQL = 150) {
  if (!isFinite(totalESP) || !isFinite(totalEQL) || totalEQL <= 0) return null;
  const avail = totalESP - (supplyDrop + returnDrop);
  const fr = (avail / totalEQL) * 100;
  return +fr.toFixed(3);
}

/** Target guidance based on metering device and refrigerant */
export function targetsFor(refrigerant = 'R410A', meteringDevice = 'txv') {
  const ref = (refrigerant || 'R410A').toUpperCase();
  const txv = (meteringDevice || 'txv').toLowerCase() === 'txv';
  // Typical residential ranges
  const deltaTRange = [16, 22];
  const targetSubcool = ref === 'R410A' ? 10 : 8; // common OEM middle
  const targetSH = txv ? 10 : 12;                 // fixed orifice often outdoor-amb dependent; this is mid
  return { deltaTRange, targetSubcool, targetSH };
}

/**
 * Evaluate system health using quick rules
 * Inputs: { deltaT, superheat, subcool, meteringDevice }
 * Returns: array of message objects { level, message }
 */
export function evaluateCoolingHealth({ deltaT, superheat, subcool, meteringDevice = 'txv' }) {
  const txv = (meteringDevice || 'txv').toLowerCase() === 'txv';
  const msgs = [];

  // Delta-T check
  if (isFinite(deltaT)) {
    if (deltaT < 14) msgs.push({ level: 'warn', message: `Low delta-T (${deltaT}°F). Check airflow, charge, coil cleanliness, and return leaks.` });
    else if (deltaT > 24) msgs.push({ level: 'warn', message: `High delta-T (${deltaT}°F). Potential low airflow or freezing risk — inspect filter, blower speed, coil frost.` });
    else msgs.push({ level: 'ok', message: `Delta-T in expected range (${deltaT}°F).` });
  }

  // Superheat / Subcool
  if (txv) {
    if (isFinite(subcool)) {
      if (subcool < 6) msgs.push({ level: 'warn', message: `Low subcool (${subcool}°F). Possible undercharge or restricted metering.` });
      else if (subcool > 14) msgs.push({ level: 'warn', message: `High subcool (${subcool}°F). Possible overcharge or condenser airflow issue.` });
      else msgs.push({ level: 'ok', message: `Subcool looks good (${subcool}°F).` });
    }
    if (isFinite(superheat)) {
      if (superheat < 5) msgs.push({ level: 'warn', message: `Very low superheat (${superheat}°F). Watch for flooding/slugging — verify TXV bulb and airflow.` });
      else if (superheat > 20) msgs.push({ level: 'warn', message: `High superheat (${superheat}°F). Could be low charge, TXV starved, or low airflow.` });
      else msgs.push({ level: 'ok', message: `Superheat reasonable (${superheat}°F).` });
    }
  } else {
    // Fixed orifice: superheat carries more weight
    if (isFinite(superheat)) {
      if (superheat < 8) msgs.push({ level: 'warn', message: `Low superheat (${superheat}°F). Potential overcharge or low airflow.` });
      else if (superheat > 25) msgs.push({ level: 'warn', message: `High superheat (${superheat}°F). Likely undercharge or liquid line restriction.` });
      else msgs.push({ level: 'ok', message: `Superheat acceptable for fixed orifice (${superheat}°F).` });
    }
    if (isFinite(subcool)) {
      if (subcool < 5) msgs.push({ level: 'warn', message: `Low subcool (${subcool}°F). Often undercharge on fixed orifice.` });
      else if (subcool > 15) msgs.push({ level: 'warn', message: `High subcool (${subcool}°F). Possible overcharge or condenser airflow problem.` });
      else msgs.push({ level: 'ok', message: `Subcool within expected range (${subcool}°F).` });
    }
  }

  return msgs;
}

/**
 * Suggest charge adjustment direction
 * Returns a human-readable recommendation (no automated amounts).
 */
export function suggestChargeAdjust({ superheat, subcool, meteringDevice = 'txv', targetSubcool = 10, targetSH = 12 }) {
  const txv = (meteringDevice || 'txv').toLowerCase() === 'txv';
  if (txv) {
    if (isFinite(subcool)) {
      if (subcool < targetSubcool - 2) return 'Subcool low — likely undercharged. Verify airflow and fix any leaks, then add refrigerant to target subcool.';
      if (subcool > targetSubcool + 2) return 'Subcool high — likely overcharged. Recover to target subcool after verifying condenser airflow.';
      return 'Charge appears close for TXV (subcool near target).';
    }
    return 'Provide liquid pressure and liquid line temperature to compute subcool for TXV systems.';
  } else {
    if (isFinite(superheat)) {
      if (superheat > targetSH + 3) return 'Superheat high — likely undercharged. Verify airflow, then add charge to bring SH toward target.';
      if (superheat < targetSH - 3) return 'Superheat low — likely overcharged or airflow low. Reduce charge only after confirming proper airflow.';
      return 'Charge appears close for fixed metering (superheat near target).';
    }
    return 'Provide suction pressure and suction line temperature to compute superheat for fixed orifice systems.';
  }
}

/* ------------------ Default Export (namespaced) ------------------ */
export default {
  calcDeltaT,
  psigToSaturationTemp,
  calcSuperheat,
  calcSubcool,
  airflowByTonnage,
  frictionRate,
  evaluateCoolingHealth,
  suggestChargeAdjust,
  targetsFor
};
