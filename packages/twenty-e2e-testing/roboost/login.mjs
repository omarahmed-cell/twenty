// Saves a Roboost CRM session for the geometry tests. Credentials come from the environment only:
//   ROBOOST_EMAIL=... ROBOOST_PASSWORD=... node roboost/login.mjs [out=roboost/.auth.json]
import { chromium } from 'playwright';

const baseUrl = process.env.ROBOOST_BASE_URL ?? 'https://chai.roboost.app';
const email = process.env.ROBOOST_EMAIL;
const password = process.env.ROBOOST_PASSWORD;
const out = process.argv[2] ?? 'roboost/.auth.json';

if (!email || !password) {
  console.error('Set ROBOOST_EMAIL and ROBOOST_PASSWORD');
  process.exit(1);
}

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();

await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
await page.getByText('Continue with Email').click();
await page.getByPlaceholder('Email').fill(email);
await page.getByRole('button', { name: /^Continue$/ }).first().click();
await page.locator('input[type="password"]').first().fill(password);
await page.keyboard.press('Enter');
await page.waitForURL((url) => !/welcome|sign-in|verify/.test(url.pathname), {
  timeout: 120_000,
});
await page.waitForTimeout(4000);
await context.storageState({ path: out });
await browser.close();
console.log(`saved ${out}`);
