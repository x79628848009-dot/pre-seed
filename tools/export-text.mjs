// Выгружает читаемый текст страниц в docs/page-text/ — для обсуждения без чтения кода.
// Запуск: node tools/export-text.mjs
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { writeFileSync, mkdirSync } from 'fs';

const PAGES = [
  { src: 'next/index.html',     out: 'docs/page-text/next.md',     title: 'Черновик новой версии · rovensky.ru/next/' },
  { src: 'pre-seed/index.html', out: 'docs/page-text/live.md',     title: 'Боевая версия · rovensky.ru/pre-seed/' },
];

mkdirSync('docs/page-text', { recursive: true });
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

for (const page of PAGES) {
  const p = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto('file://' + process.cwd() + '/' + page.src, { waitUntil: 'load' });
  // раскрыть все аккордеоны, чтобы скрытый текст попал в выгрузку
  await p.evaluate(() => document.querySelectorAll('details').forEach(d => (d.open = true)));
  await p.waitForTimeout(200);

  const data = await p.evaluate(() => {
    const clean = s => s.replace(/ /g, ' ').replace(/[ \t]+/g, ' ').trim();
    const out = [];
    document.querySelectorAll('section, header').forEach(sec => {
      const no = sec.querySelector('.section-no')?.textContent?.trim();
      const eyebrow = sec.querySelector('.eyebrow')?.textContent?.trim();
      const head = no || eyebrow || sec.id || '';
      const text = clean(sec.innerText);
      if (text) out.push({ head, text });
    });
    return { title: document.title, words: document.body.innerText.split(/\s+/).length, out };
  });

  const lines = [
    `# ${page.title}`, '',
    `Автовыгрузка текста страницы. Файл: \`${page.src}\` · объём ~${data.words} слов.`,
    'Раскрывающиеся блоки раскрыты. Обновляется скриптом `tools/export-text.mjs` после каждой правки.', '',
    '---', ''
  ];
  for (const sec of data.out) {
    if (sec.head) lines.push(`## ${sec.head}`, '');
    lines.push(sec.text, '');
  }
  writeFileSync(page.out, lines.join('\n'));
  console.log(`${page.out}: ${data.words} слов`);
  await p.close();
}
await browser.close();
