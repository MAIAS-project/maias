/**
 * Regenerate the README screenshots: drives the MAIAS Browser (web) with
 * headless Chromium and screenshots the simulated phone frame for each
 * bundled example, writing into examples/<name>/screenshots/ and
 * MAIAS_browser/screenshots/document-menu.png.
 *
 * Prerequisites:
 *   npm run web --workspace maias-browser        # dev server (default port 8081)
 *   npm i --no-save playwright && npx playwright install chromium
 *
 * Usage:
 *   node scripts/capture-example-screenshots.js   # PORT=8082 to override
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE = `http://localhost:${process.env.PORT || 8081}`;
const ROOT = path.join(__dirname, '..');

// card: title on the document menu · screens: Quick Nav jumps after the entry
// screen (path doubles as the search query and the row text to click)
const PLAN = [
  { card: 'Calculator', dir: 'calculator', entry: 'calculator', screens: [] },
  {
    card: 'Todo List', dir: 'todo_list', entry: 'home',
    screens: [
      { path: '/tasks/:id', file: 'task_detail', urlPart: '/tasks/' },
      { path: '/tasks/new', file: 'task_new', urlPart: '/tasks/new' },
    ],
  },
  {
    card: 'SocialNet', dir: 'social_network', entry: 'feed',
    screens: [
      { path: '/explore/user/:username', file: 'user_profile', urlPart: '/explore/user/' },
      { path: '/feed/compose', file: 'compose_post', urlPart: '/feed/compose' },
    ],
  },
  {
    card: 'Shopfront', dir: 'ecommerce', entry: 'home',
    screens: [
      { path: '/categories/:category_id/products/:product_id', file: 'product', urlPart: '/products/' },
      { path: '/stores', file: 'store_finder', urlPart: '/stores' },
    ],
  },
];

async function deviceFrame(page) {
  // the phone frame is the only div with the 44px corner radius (app/_layout.tsx)
  const handle = await page.evaluateHandle(() =>
    [...document.querySelectorAll('div')].find((d) => getComputedStyle(d).borderRadius === '44px')
  );
  const el = handle.asElement();
  if (!el) throw new Error('device frame not found — is the app in mobile layout mode?');
  return el;
}

async function shot(page, file) {
  const el = await deviceFrame(page);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(600);
  await el.screenshot({ path: file });
  console.log(`  saved ${path.relative(ROOT, file)}`);
}

// Tapping the centred header title toggles the UI ↔ data (IA metadata) view.
async function toggleScreenView(page) {
  const box = await (await deviceFrame(page)).boundingBox();
  await page.mouse.click(box.x + box.width / 2, box.y + 58);
  await page.waitForTimeout(400);
}

async function quickNavTo(page, screen) {
  const box = await (await deviceFrame(page)).boundingBox();
  // the Quick Nav FAB sits 16px from the right, 70px above the home-indicator row
  await page.mouse.click(box.x + box.width - 16 - 22, box.y + box.height - 70 - 22);
  await page.getByText('Quick Nav', { exact: true }).waitFor({ timeout: 5000 });
  await page.getByPlaceholder(/Search \d+ screens/).fill(screen.path);
  await page.getByText(screen.path, { exact: true }).click();
  await page.waitForURL((u) => u.pathname.includes(screen.urlPart.replace(/:.*/, '')), { timeout: 15000 });
  await page.waitForTimeout(300);
}

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  page.on('pageerror', (e) => console.log('PAGE ERROR:', e.message));

  // first load compiles the Metro bundle — be patient
  await page.goto(BASE, { timeout: 120000 });
  await page.getByText('Examples', { exact: true }).waitFor({ timeout: 120000 });
  await shot(page, path.join(ROOT, 'MAIAS_browser/screenshots/document-menu.png'));

  for (const ex of PLAN) {
    console.log(`== ${ex.card}`);
    await page.goto(BASE, { timeout: 60000 });
    await page.getByText('Examples', { exact: true }).waitFor({ timeout: 60000 });
    await page.getByText(ex.card, { exact: true }).click();
    await page.waitForURL((u) => u.pathname !== '/', { timeout: 30000 });
    const dest = path.join(ROOT, 'examples', ex.dir, 'screenshots');
    const uiAndDataShots = async (name) => {
      await shot(page, path.join(dest, `${name}.png`));
      await toggleScreenView(page);
      await shot(page, path.join(dest, `${name}_data.png`));
      await toggleScreenView(page); // back to UI view — the preference is app-wide
    };
    await uiAndDataShots(ex.entry);
    for (const s of ex.screens) {
      await quickNavTo(page, s);
      await uiAndDataShots(s.file);
    }
  }

  await browser.close();
  console.log('done');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
