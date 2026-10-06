'use strict';
// KaloriKu local catalog quality gate (Node.js >=18, no dependencies).
// Run from any directory: node scripts/audit-foods.cjs
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const dataFiles = [
  'data/foods.json',
  'data/foods-daily.json',
  'data/foods-regional.json',
  'data/foods-extra.json',
  'data/foods-expanded.json',
  'data/foods-tkpi-2017.json',
  'data/foods-tkpi-2020.json'
];
const errors = [];
const warnings = [];
const entries = [];
for (const filename of dataFiles) {
  const absolute = path.join(root, filename);
  if (!fs.existsSync(absolute)) {
    errors.push('Berkas hilang: ' + filename);
    continue;
  }
  try {
    const data = JSON.parse(fs.readFileSync(absolute, 'utf8'));
    if (!Array.isArray(data)) throw Error('root bukan array');
    for (const food of data) entries.push({ ...food, _filename: filename });
  } catch (err) {
    errors.push('Gagal membaca ' + filename + ': ' + err.message);
  }
}
function normalizedName(s) {
  return String(s || '').toLowerCase().normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\btelor\b/g, 'telur').replace(/\bsego\b/g, 'nasi')
    .replace(/\bsambel\b/g, 'sambal').replace(/\bgethuk\b/g, 'getuk')
    .replace(/\bmata sapi\b/g, 'ceplok').replace(/\bmie\b/g, 'mi')
    .replace(/\bbakmie\b/g, 'bakmi').replace(/\bsup\b/g, 'sop')
    .replace(/\btoge\b/g, 'tauge').replace(/\btempeh\b/g, 'tempe')
    .replace(/\bcoklat\b/g, 'cokelat').replace(/\bcappucino\b/g, 'cappuccino')
    .replace(/\bkwetiaw\b/g, 'kwetiau').replace(/\bkrispi\b/g, 'crispy')
    .replace(/\bbaso\b/g, 'bakso').trim().replace(/\s+/g, ' ');
}
const byId = new Map();
const byName = new Map();
const codeToFood = new Map();
const macroFlags = [];
let withoutCode = 0;
for (const food of entries) {
  if (typeof food.id !== 'string' || !food.id) {
    errors.push('ID kosong pada ' + (food.name || '?'));
  } else if (byId.has(food.id)) {
    errors.push('ID duplikat: ' + food.id);
  } else byId.set(food.id, food);
  if (!food.name || !food.serving) errors.push('Nama atau takaran kosong: ' + food.id);
  const nameKey = normalizedName(food.name);
  if (byName.has(nameKey)) warnings.push('Nama setara disaring pencarian: ' + food.name);
  else byName.set(nameKey, food);
  for (const nutrient of ['calories', 'protein', 'carbs', 'fat']) {
    if (!(typeof food[nutrient] === 'number' && Number.isFinite(food[nutrient]) && food[nutrient] >= 0)) {
      errors.push('Gizi tak valid ' + food.id + '.' + nutrient);
    }
  }
  for (const nutrient of ['fiber', 'sodium', 'sugar', 'saturatedFat']) {
    if (food[nutrient] !== undefined && !(typeof food[nutrient] === 'number' && Number.isFinite(food[nutrient]) && food[nutrient] >= 0)) {
      errors.push('Nutrien tambahan tak valid ' + food.id + '.' + nutrient);
    }
  }
  if (food.source_type === 'tkpi') {
    if (food.serving !== '100 g BDD') errors.push('Entri TKPI asli bukan 100 g BDD: ' + food.id);
    if (!food.tkpi_code) {
      withoutCode++;
      if (food.verification_status !== 'code_not_recorded') errors.push('TKPI tanpa kode belum diberi status: ' + food.id);
    } else {
      const other = codeToFood.get(food.tkpi_code);
      if (other) {
        const alias = food.tkpi_alias_of === other.id ? food : other.tkpi_alias_of === food.id ? other : null;
        if (!alias || food.serving !== other.serving ||
            !['calories','protein','carbs','fat'].every(k => Math.abs(food[k]-other[k]) < 0.011)) {
          errors.push('Kode TKPI ganda tanpa alias yang identik: ' + food.tkpi_code);
        } else warnings.push('Alias TKPI: ' + alias.id);
      } else codeToFood.set(food.tkpi_code, food);
    }
  }
  if (!['tkpi', 'estimate', 'calculated'].includes(food.source_type)) {
    errors.push('Jenis sumber tidak dikenal: ' + food.id);
  }
  const c = food.calories, p = food.protein, carb = food.carbs, fat = food.fat;
  if ([c,p,carb,fat].every(Number.isFinite) && Math.abs(c - 4*p - 4*carb - 9*fat) > Math.max(30, c*.2)) {
    macroFlags.push(food);
    if (food.source_type === 'tkpi' && !['printed_source_anomaly', 'printed_source_conflict'].includes(food.verification_status)) {
      errors.push('Anomali energi-makro TKPI tanpa status: ' + food.id);
    }
  }
}
// Compare the catalog against the recorded row-level source audit, not 4/4/9 alone.
const macroEvidence = JSON.parse(fs.readFileSync(path.join(root, 'docs/TKPI_MACRO_AUDIT_97_2026-10-06.json'), 'utf8'));
if (macroEvidence.length !== 97 || new Set(macroEvidence.map(f => f.id)).size !== 97) errors.push('Bukti audit makro harus mencakup 97 ID unik');
for (const row of macroEvidence) {
  const food = byId.get(row.id);
  if (!food || food.tkpi_code !== row.tkpi_code) { errors.push('Bukti audit tidak cocok: ' + row.id); continue; }
  for (const key of ['calories','protein','fat','carbs']) {
    if (Math.abs(food[key] - row[key]) > 0.011) errors.push('Berbeda dengan baris sumber: ' + row.id + '.' + key);
  }
  if (!food.macro_verification_status || !row.source_url) errors.push('Lingkup audit hilang: ' + row.id);
}
let calculatedCount = 0;
for (const food of entries) {
  if (food.source_type !== 'calculated') continue;
  calculatedCount++;
  const base = byId.get(food.portion_derived_from);
  if (!base || base.source_type !== 'tkpi' || base.serving !== '100 g BDD') {
    errors.push('Konversi tanpa induk TKPI 100g: ' + food.id);
    continue;
  }
  if (!(typeof food.portion_multiplier === 'number' && food.portion_multiplier > 0)) {
    errors.push('Pengali porsi tak valid: ' + food.id);
    continue;
  }
  for (const nutrient of ['calories', 'protein', 'carbs', 'fat', 'fiber', 'sodium']) {
    if (typeof base[nutrient] !== 'number' || typeof food[nutrient] !== 'number') continue;
    if (Math.abs(food[nutrient] - base[nutrient] * food.portion_multiplier) > 0.155) {
      errors.push('Konversi usang: ' + food.id + '.' + nutrient);
    }
  }
}
const sourceCount = entries.reduce((out, f) => {
  out[f.source_type] = (out[f.source_type] || 0) + 1;
  return out;
}, {});
const report = {
  rawEntries: entries.length,
  searchableNames: byName.size,
  duplicateNames: entries.length - byName.size,
  sourceCount,
  tkpiWithoutCode: withoutCode,
  uniqueTkpiCodes: codeToFood.size,
  tkpiAliases: entries.filter(x => x.source_type === 'tkpi' && x.tkpi_alias_of).length,
  calculatedCount,
  fiberEntries: entries.filter(f => typeof f.fiber === 'number').length,
  sodiumEntries: entries.filter(f => typeof f.sodium === 'number').length,
  macroFlags: macroFlags.map(f => ({ id: f.id, name: f.name, status: f.verification_status || null })),
  warningCount: warnings.length,
  errorCount: errors.length,
  errors: errors.slice(0, 50)
};
process.stdout.write(JSON.stringify(report, null, 2) + '\n');
if (errors.length) process.exitCode = 1;
