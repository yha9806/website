/**
 * VULCA 2K Demo Video Recorder
 *
 * Records a full product demo at 2560×1440 (2K) resolution using Playwright.
 * Not limited by physical screen size — renders at native 2K.
 *
 * Usage:
 *   npx playwright test marketing/demo-scripts/record-2k-demo.ts --config=tests/e2e/playwright.config.ts
 *
 * Or standalone:
 *   npx ts-node marketing/demo-scripts/record-2k-demo.ts
 *
 * Output: marketing/demo-scripts/exports/vulca-demo-2k.webm
 *
 * Pre-requisites:
 *   - Backend running on :8001 with GOOGLE_API_KEY set (NB2 mode)
 *   - Frontend running on :5173
 *   - At least 1 real NB2 session in Gallery
 */

import { chromium } from 'playwright';
import * as path from 'path';
import * as fs from 'fs';

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:8001';
const WIDTH = 2560;
const HEIGHT = 1440;
const EXPORT_DIR = path.join(__dirname, 'exports');

// Timing helpers
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
const scrollToCenter = async (page: any, selector: string) => {
  await page.evaluate((sel: string) => {
    document.querySelector(sel)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, selector);
  await wait(800);
};

async function main() {
  // Ensure export directory
  if (!fs.existsSync(EXPORT_DIR)) fs.mkdirSync(EXPORT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    recordVideo: {
      dir: EXPORT_DIR,
      size: { width: WIDTH, height: HEIGHT },
    },
    // Disable animations for cleaner recording (optional)
    // reducedMotion: 'reduce',
  });

  const page = await context.newPage();

  // ─────────────────────────────────────────────────────
  // SCENE 1: Canvas — Creation Flow (0:00 – 1:00)
  // ─────────────────────────────────────────────────────

  console.log('[Scene 1] Canvas — Empty State');
  await page.goto(`${BASE_URL}/canvas`);
  await page.waitForSelector('textarea', { timeout: 10000 });
  await wait(2000); // Hold on empty state

  // Type intent naturally
  console.log('[Scene 1] Typing intent...');
  await page.fill('textarea', '');
  await page.type('textarea', 'Lotus pond with morning mist in traditional ink wash style', { delay: 60 });
  await wait(1500);

  // Click NB2 provider
  console.log('[Scene 1] Switching to NB2...');
  const nb2Button = page.locator('text=NB2');
  if (await nb2Button.isVisible()) {
    await nb2Button.click();
    await wait(500);
  }

  // Screenshot: Canvas ready state
  await page.screenshot({ path: path.join(EXPORT_DIR, '01-canvas-ready-2k.png'), type: 'png' });

  // Click Create/Run
  console.log('[Scene 1] Starting pipeline...');
  const createBtn = page.locator('button:has-text("Create"), button:has-text("Run")').first();
  await createBtn.click();
  await wait(1000);

  // Screenshot: Pipeline running
  await page.screenshot({ path: path.join(EXPORT_DIR, '02-pipeline-running-2k.png'), type: 'png' });

  // Wait for pipeline completion (up to 3 minutes for NB2)
  console.log('[Scene 1] Waiting for pipeline (up to 180s)...');
  try {
    await page.waitForSelector('[class*="FinalResult"], [class*="finalResult"], text=Overall Score', {
      timeout: 180000,
    });
  } catch {
    console.log('[Scene 1] Pipeline still running, waiting more...');
    await wait(30000);
  }

  // Screenshot: Results
  await page.screenshot({ path: path.join(EXPORT_DIR, '03-results-2k.png'), type: 'png' });

  // Scroll to radar chart / L1-L5 scores
  console.log('[Scene 1] Capturing L1-L5 scores...');
  await scrollToCenter(page, '[class*="radar"], [class*="Radar"], [class*="critic"]');
  await page.screenshot({ path: path.join(EXPORT_DIR, '04-scores-2k.png'), type: 'png' });
  await wait(2000);

  // ─────────────────────────────────────────────────────
  // SCENE 2: Gallery — Browse & Interact (1:00 – 1:30)
  // ─────────────────────────────────────────────────────

  console.log('[Scene 2] Gallery...');
  await page.goto(`${BASE_URL}/gallery`);
  await page.waitForSelector('[class*="gallery"], [class*="Gallery"], main img', { timeout: 10000 });
  await wait(2000);

  // Screenshot: Gallery overview
  await page.screenshot({ path: path.join(EXPORT_DIR, '05-gallery-2k.png'), type: 'png' });

  // Full page screenshot
  await page.screenshot({
    path: path.join(EXPORT_DIR, '05b-gallery-fullpage-2k.png'),
    type: 'png',
    fullPage: true,
  });

  // Click first real artwork card (with actual image, not placeholder)
  const artCards = page.locator('[class*="card"], [class*="Card"]').filter({ has: page.locator('img[src*="/images/"]') });
  if (await artCards.count() > 0) {
    await artCards.first().click();
    await wait(1500);
    await page.screenshot({ path: path.join(EXPORT_DIR, '06-gallery-detail-2k.png'), type: 'png' });
  }

  // Like button
  const likeBtn = page.locator('button:has-text("Like"), [class*="like"]').first();
  if (await likeBtn.isVisible()) {
    await likeBtn.click();
    await wait(1000);
  }

  // Fork button
  const forkBtn = page.locator('button:has-text("Fork")').first();
  if (await forkBtn.isVisible()) {
    await forkBtn.click();
    await wait(2000);
    // Should navigate to Canvas with pre-filled intent
    await page.screenshot({ path: path.join(EXPORT_DIR, '07-fork-prefill-2k.png'), type: 'png' });
  }

  // ─────────────────────────────────────────────────────
  // SCENE 3: Admin Dashboard — Evolution (1:30 – 2:30)
  // ─────────────────────────────────────────────────────

  console.log('[Scene 3] Admin Dashboard...');

  // Login first
  const loginRes = await page.evaluate(async (apiUrl: string) => {
    const params = new URLSearchParams();
    params.append('username', 'admin');
    params.append('password', 'admin123');
    const res = await fetch(`${apiUrl}/api/v1/auth/token`, {
      method: 'POST',
      body: params,
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('access_token', data.access_token);
      return 'ok';
    }
    return 'fail';
  }, API_URL);
  console.log(`[Scene 3] Admin login: ${loginRes}`);

  await page.goto(`${BASE_URL}/admin`);
  await wait(3000);

  // Screenshot: Admin top stats
  await page.screenshot({ path: path.join(EXPORT_DIR, '08-admin-top-2k.png'), type: 'png' });

  // Scroll through dashboard sections
  const sections = [
    { name: 'agent-insights', label: '09-agent-insights' },
    { name: 'cluster', label: '10-clusters' },
    { name: 'archetype', label: '11-archetypes' },
    { name: 'evolution', label: '12-evolution-curve' },
  ];

  for (const section of sections) {
    console.log(`[Scene 3] Scrolling to ${section.name}...`);
    // Try multiple selectors
    const found = await page.evaluate((name: string) => {
      const el = document.querySelector(`[class*="${name}"], [id*="${name}"], h2:has-text("${name}"), h3:has-text("${name}")`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return true;
      }
      // Fallback: scroll down incrementally
      window.scrollBy(0, 600);
      return false;
    }, section.name);
    await wait(2000);
    await page.screenshot({ path: path.join(EXPORT_DIR, `${section.label}-2k.png`), type: 'png' });
  }

  // Full page screenshot of admin
  await page.screenshot({
    path: path.join(EXPORT_DIR, '13-admin-fullpage-2k.png'),
    type: 'png',
    fullPage: true,
  });

  // ─────────────────────────────────────────────────────
  // SCENE 4: Home Page (2:30 – 2:45)
  // ─────────────────────────────────────────────────────

  console.log('[Scene 4] Home page...');
  await page.goto(`${BASE_URL}/`);
  await wait(2000);
  await page.screenshot({ path: path.join(EXPORT_DIR, '14-home-2k.png'), type: 'png' });
  await page.screenshot({
    path: path.join(EXPORT_DIR, '14b-home-fullpage-2k.png'),
    type: 'png',
    fullPage: true,
  });

  // ─────────────────────────────────────────────────────
  // Done — close & save video
  // ─────────────────────────────────────────────────────

  console.log('[Done] Closing browser and saving video...');
  await page.close(); // This triggers video save
  await context.close();
  await browser.close();

  // Find the recorded video file
  const videoFiles = fs.readdirSync(EXPORT_DIR).filter(f => f.endsWith('.webm'));
  if (videoFiles.length > 0) {
    const latest = videoFiles[videoFiles.length - 1];
    const dest = path.join(EXPORT_DIR, 'vulca-demo-2k.webm');
    fs.renameSync(path.join(EXPORT_DIR, latest), dest);
    console.log(`\nVideo saved: ${dest}`);
    console.log(`Resolution: ${WIDTH}×${HEIGHT} (2K)`);
    console.log('\nTo convert to MP4:');
    console.log(`  ffmpeg -i "${dest}" -c:v libx264 -crf 18 -preset slow "${dest.replace('.webm', '.mp4')}"`);
  }

  console.log(`\nScreenshots saved to: ${EXPORT_DIR}/`);
}

main().catch(console.error);
