import { defineConfig, devices } from '@playwright/test';

const smokePort = process.env.PLAYWRIGHT_PORT || '18080';
const baseURL =
    process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${smokePort}`;

export default defineConfig({
    expect: {
        timeout: 10000
    },
    projects: [
        {
            name: 'chromium',
            use: {
                ...devices['Desktop Chrome']
            }
        }
    ],
    testDir: './browser-smoke',
    timeout: 30000,
    use: {
        baseURL,
        trace: 'on-first-retry'
    },
    webServer: process.env.PLAYWRIGHT_BASE_URL
        ? undefined
        : {
              command: `PORT=${smokePort} npm start`,
              reuseExistingServer: false,
              timeout: 30000,
              url: `${baseURL}/api`
          }
});
