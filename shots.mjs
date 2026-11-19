// Vice Atlas — take the entry's 4 screenshots with headless Chromium, and smoke
// check the guide while it is open: 55 rows render, the checklist persists
// across a reload, the filters and the spoiler setting work, export downloads a
// file and import reads it back. Writes JPEGs into screenshots/.
//
// Run from the repo root:
//   node shots.mjs
// Playwright is loaded from the shared install at
// /home/hatch/workspace/makefun/.browser-test/node_modules (NODE_PATH does not
// apply to ES module imports, so the script requires it from that path).
// Serves app/ itself on port 8091, so no other server needs to run.
import { createRequire } from 'node:module';
const require = createRequire('/home/hatch/workspace/makefun/.browser-test/package.json');
const { chromium } = require('playwright');
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('.', import.meta.url));
const appRoot = join(repo, 'app');
const shotsDir = join(repo, 'screenshots');
const PORT = 8091;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

const server = createServer((req, res) => {
  const path = req.url.split('?')[0] === '/' ? '/index.html' : req.url.split('?')[0];
  const file = resolve(appRoot, `.${path}`);
  if (!file.startsWith(appRoot) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((done) => server.listen(PORT, done));

// A plausible mid-playthrough state: 13 earned across story, activities,
// one-off feats and the money/app trophies.
const SEEDED = [2, 3, 4, 8, 9, 10, 16, 21, 44, 45, 46, 53, 55];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('console', (msg) => { if (msg.type() === 'error') errors.push(`console: ${msg.text()}`); });
page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
const requests = [];
page.on('request', (req) => requests.push(req.url()));

await page.addInitScript((earned) => {
  // Seed only on a fresh profile: the script runs on every navigation, and
  // re-seeding would wipe a toggle the persistence check just made.
  if (!window.localStorage.getItem('vice-atlas-progress-v1')) {
    window.localStorage.setItem('vice-atlas-progress-v1', JSON.stringify({ earned, spoilerFree: false }));
  }
}, SEEDED);

await page.goto(`http://localhost:${PORT}/`, { waitUntil: 'networkidle' });
await page.waitForSelector('.trophy', { timeout: 10000 });

// Smoke checks.
const rowCount = await page.locator('.trophy').count();
console.log(`tracker rows rendered: ${rowCount}`);
const progressText = await page.locator('#progressText').textContent();
console.log(`progress line: ${progressText}`);

// Persistence: tick one more trophy, reload, confirm it is still earned.
// (Click, not check(): ticking re-renders the list and replaces the checkbox.)
await page.locator('.trophy[data-id="20"] input[type="checkbox"]').click();
await page.waitForTimeout(300);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('.trophy');
const stillChecked = await page.locator('.trophy[data-id="20"] input[type="checkbox"]').isChecked();
const afterReload = await page.locator('#progressText').textContent();
console.log(`persistence after reload: id 20 checked=${stillChecked}, progress=${afterReload}`);

// Filters: kind=collectible should show only the 7 collectibles.
await page.selectOption('#kindFilter', 'collectible');
await page.waitForTimeout(200);
const collectibleRows = await page.locator('.trophy').count();
console.log(`kind filter (collectible): ${collectibleRows} rows`);
await page.selectOption('#kindFilter', 'all');

// Spoiler-free: unearned story trophies mask their names.
await page.locator('#spoilerFree').check();
await page.waitForTimeout(200);
const hiddenRows = await page.locator('.trophy.spoiler-hidden').count();
console.log(`spoiler-free on: ${hiddenRows} hidden rows`);
await page.locator('#spoilerFree').uncheck();

// Export: clicking the button must start a download.
const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
await page.locator('#exportBtn').click();
const download = await downloadPromise;
console.log(`export download: ${download ? await download.suggestedFilename() : 'NONE'}`);

// Import: write a small export file and feed it to the import input.
const importPayload = { app: 'vice-atlas', version: 1, earned: [1, 2, 3], spoilerFree: false };
writeFileSync('/tmp/vice-atlas-import-test.json', JSON.stringify(importPayload));
await page.locator('#importFile').setInputFiles('/tmp/vice-atlas-import-test.json');
await page.waitForTimeout(300);
const afterImport = await page.locator('#progressText').textContent();
console.log(`after import: ${afterImport}`);
// Restore the seeded state for the screenshots.
await page.evaluate((earned) => {
  window.localStorage.setItem('vice-atlas-progress-v1', JSON.stringify({ earned, spoilerFree: false }));
}, SEEDED);
await page.reload({ waitUntil: 'networkidle' });
await page.waitForSelector('.trophy');

mkdirSync(shotsDir, { recursive: true });

// Park the mouse in the top-left corner before each shot: a hovered trophy row
// takes the accent border, and the pointer would otherwise sit on a row the
// click scrolled under it.
async function shoot(name) {
  await page.mouse.move(10, 10);
  await page.waitForTimeout(150);
  await page.screenshot({ path: join(shotsDir, name), type: 'jpeg', quality: 82 });
}

// 1 — cover: checklist with progress, filters on top, a trophy's guide open.
// Clicking scrolls the row into view, so scroll back to the top first: the
// detail pane is sticky, so the guide stays visible beside the list's top rows.
await page.locator('.trophy[data-id="15"]').click();
await page.waitForTimeout(300);
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(200);
await shoot('1-cover.jpg');

// 2 — roadmap to the platinum.
await page.locator('#tabs button[data-view="roadmap"]').click();
await page.waitForTimeout(300);
await shoot('2-roadmap.jpg');

// 3 — missables flagged, with a guide open.
await page.locator('#tabs button[data-view="missables"]').click();
await page.waitForTimeout(300);
await page.locator('.trophy[data-id="33"]').click();
await page.waitForTimeout(300);
await shoot('3-missables.jpg');

// 4 — spoiler-free on: story trophies hidden until earned. Select an unearned
// story trophy so both its row and the detail pane show the masked state.
await page.locator('#tabs button[data-view="tracker"]').click();
await page.waitForTimeout(200);
await page.locator('#spoilerFree').check();
await page.waitForTimeout(300);
await page.locator('.trophy[data-id="5"]').click();
await page.waitForTimeout(300);
await shoot('4-spoiler.jpg');

for (const name of ['1-cover.jpg', '2-roadmap.jpg', '3-missables.jpg', '4-spoiler.jpg']) {
  const size = statSync(join(shotsDir, name)).size;
  console.log(`${name}: ${size} bytes${size > 262144 ? ' — OVER THE 256 KiB CAP' : ''}`);
}

const offOrigin = requests.filter((url) => !url.startsWith(`http://localhost:${PORT}`));
console.log(`requests off the app server: ${offOrigin.length ? offOrigin.join(', ') : 'none'}`);
console.log(`console/page errors: ${errors.length ? errors.join(' | ') : 'none'}`);

await browser.close();
server.close();
