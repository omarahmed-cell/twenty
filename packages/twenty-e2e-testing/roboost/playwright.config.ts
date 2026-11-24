import { defineConfig } from '@playwright/test';

// Runs against a deployed Roboost CRM (chai by default) with a saved login:
//   ROBOOST_STORAGE_STATE=<state.json> npx playwright test -c roboost/playwright.config.ts
// Create the state with roboost/login.setup.ts (ROBOOST_EMAIL / ROBOOST_PASSWORD from the environment).
const BASE_URL = process.env.ROBOOST_BASE_URL ?? 'https://chai.roboost.app';
const STORAGE_STATE = process.env.ROBOOST_STORAGE_STATE ?? 'roboost/.auth.json';

// Browser zoom z renders a W x H window as a (W / z) x (H / z) CSS viewport at device scale z
const WINDOWS = [
  { width: 1280, height: 800 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
];
const BROWSER_ZOOMS = [0.67, 0.8, 1];

export default defineConfig({
  testDir: '.',
  testMatch: /.*\.spec\.ts/,
  outputDir: 'run_results/',
  fullyParallel: false,
  workers: 1,
  timeout: 15 * 60 * 1000,
  reporter: [['list']],
  use: {
    baseURL: BASE_URL,
    storageState: STORAGE_STATE,
    headless: true,
    channel: process.env.ROBOOST_BROWSER_CHANNEL ?? 'chrome',
    actionTimeout: 30_000,
    navigationTimeout: 600_000,
  },
  projects: [
    ...WINDOWS.flatMap((windowSize) =>
      BROWSER_ZOOMS.map((zoom) => ({
        name: `${windowSize.width}x${windowSize.height} zoom ${Math.round(zoom * 100)}%`,
        metadata: { uiScale: 1 },
        use: {
          viewport: {
            width: Math.round(windowSize.width / zoom),
            height: Math.round(windowSize.height / zoom),
          },
          deviceScaleFactor: zoom,
        },
      })),
    ),
    // The interface scale "Smaller" (html zoom 0.9) is what pushed lists over their fields
    ...BROWSER_ZOOMS.map((zoom) => ({
      name: `1440x900 zoom ${Math.round(zoom * 100)}% ui scale 90%`,
      metadata: { uiScale: 0.9 },
      use: {
        viewport: {
          width: Math.round(1440 / zoom),
          height: Math.round(900 / zoom),
        },
        deviceScaleFactor: zoom,
      },
    })),
  ],
});
