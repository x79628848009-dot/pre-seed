// Проверка целостности черновика: каждый продукт представлен во всех местах,
// статусы — из единого словаря. Запуск: node tools/check-invariants.mjs
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';

const PRODUCTS = ['AURA', 'MyBrain', 'SMM Engine', 'MyUniverse', 'Meridian'];
const PLACES = [
  { name: 'карта портфеля',   sel: '#pmap .mn' },
  { name: 'карточка vcard',   sel: '.vcard h3' },
  { name: 'разбор подробнее', sel: 'details.acc summary' },
  { name: 'созвездие',        sel: '#cst .nd' },
];
const STATUS_DICT = ['ТЕСТИРУЕТСЯ', 'СТРОИТСЯ', 'ПРОЕКТ', 'ЕЖЕДНЕВНАЯ ПРАКТИКА'];

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const p = await browser.newPage();
await p.goto('file://' + process.cwd() + '/next/index.html', { waitUntil: 'load' });

let fail = 0;
const matrix = await p.evaluate((PLACES) => {
  return PLACES.map(pl => [...document.querySelectorAll(pl.sel)].map(n =>
    (n.getAttribute && (n.getAttribute('data-read')||'')) + ' ' + n.textContent).join(' | '));
}, PLACES);

console.log('── Продукт × место представления ──');
for (const prod of PRODUCTS) {
  const row = PLACES.map((pl, i) => {
    // созвездие и карта: сервисные не обязательны в созвездии
    const present = matrix[i].includes(prod);
    return present ? '✓' : '—';
  });
  // правила: карточка обязательна всем; разбор обязателен всем, кроме SMM Engine (сервис, описан в 02);
  // созвездие — только четырём продуктам (без SMM Engine); карта — всем.
  const problems = [];
  if (row[0] === '—') problems.push('нет на карте');
  if (row[1] === '—') problems.push('нет карточки');
  if (row[2] === '—' && prod !== 'SMM Engine') problems.push('нет разбора «подробнее»');
  if (row[3] === '—' && prod !== 'SMM Engine') problems.push('нет в созвездии');
  const status = problems.length ? 'ПРОБЛЕМА: ' + problems.join(', ') : 'ок';
  if (problems.length) fail++;
  console.log(`${prod.padEnd(12)} карта:${row[0]} карточка:${row[1]} разбор:${row[2]} созвездие:${row[3]} → ${status}`);
}

// статусы вне словаря на схеме лаборатории
const badStatuses = await p.evaluate((dict) =>
  [...document.querySelectorAll('#labchart .st')].map(t => t.textContent.trim())
    .filter(t => !dict.some(d => t.startsWith(d))), STATUS_DICT);
if (badStatuses.length) { console.log('Статусы вне словаря:', badStatuses.join(', ')); fail++; }
else console.log('Статусы лаборатории: словарь соблюдён');

await browser.close();
if (fail) { console.log(`\n✗ НАРУШЕНИЙ: ${fail}`); process.exit(1); }
console.log('\n✓ Целостность соблюдена');
