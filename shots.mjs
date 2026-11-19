// Takes the entry's screenshots with Playwright Chromium: serves app/ on a
// local port, seeds 13 of 55 trophies earned (so the progress bar and the
// counters read part-way, as a real player's would), and shoots the four views
// shots.json names at 1280x800, JPEG quality 82, each under the 256 KiB cap.
//
// Usage: node shots.mjs [port]   (default port 8091)

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('/home/hatch/workspace/makefun/.browser-test/node_modules/playwright');

const here = dirname(fileURLToPath(import.meta.url));
const port = Number(process.argv[2] ?? 8091);
const shots = (await import(join(here, 'shots.json'), { with: { type: 'json' } })).default;

// 13 earned: the opening story run plus a few early activities and collectibles.
const SEEDED_EARNED = [2, 3, 4, 5, 6, 8, 9, 10, 15, 16, 21, 35, 55];
const STORAGE_KEY = 'gta6-trophy-guide-progress-v1';
const MAX_BYTES = 262144;

function waitForServer(url, tries = 40) {
  return new Promise((resolve, reject) => {
    const attempt = async (left) => {
      try {
        const response = await fetch(url);
        if (response.ok) return resolve();
      } catch { /* not up yet */ }
      if (left <= 0) return reject(new Error('server did not come up'));
      setTimeout(() => attempt(left - 1), 250);
    };
    attempt(tries);
  });
}

const server = spawn('node', ['serve.ts', '--port', String(port)], { cwd: here, stdio: 'ignore' });
try {
  await waitForServer(`http://127.0.0.1:${port}/`);
  const browser = await chromium.launch();
  try {
    for (const shot of shots) {
      const page = await browser.newPage({ viewport: shot.viewport });
      const earned = shot.earned ?? SEEDED_EARNED;
      await page.addInitScript(({ key, earned }) => {
        localStorage.setItem(key, JSON.stringify({ earned, spoiler: false }));
      }, { key: STORAGE_KEY, earned });
      await page.goto(`http://127.0.0.1:${port}${shot.path}`, { waitUntil: 'networkidle' });
      await page.waitForSelector('.trophy-row');
      if (shot.view && shot.view !== 'tracker') {
        await page.click(`#tabs button[data-view="${shot.view}"]`);
        await page.waitForTimeout(300);
      }
      if (shot.spoiler) {
        await page.check('#spoiler');
        await page.waitForTimeout(300);
      }
      if (shot.selected) {
        await page.evaluate((id) => {
          const rows = document.querySelectorAll('.trophy-row');
          rows[id - 1]?.scrollIntoView({ block: 'center' });
          rows[id - 1]?.click();
        }, shot.selected);
        await page.waitForTimeout(300);
      }
      const out = join(here, 'screenshots', shot.file);
      let quality = 82;
      await page.screenshot({ path: out, type: 'jpeg', quality });
      while (statSync(out).size > MAX_BYTES && quality > 55) {
        quality -= 8;
        await page.screenshot({ path: out, type: 'jpeg', quality });
      }
      const size = statSync(out).size;
      console.log(`${shot.file}: ${size} bytes at quality ${quality}${size > MAX_BYTES ? ' — STILL OVER CAP' : ''}`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
} finally {
  server.kill();
}
console.log('done');
