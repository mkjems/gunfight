import { expect, test } from '@playwright/test';

test('built browser app loads and starts', async ({ page }) => {
    const browserErrors = [];

    page.on('pageerror', function (error) {
        browserErrors.push(error.message);
    });

    page.on('console', function (message) {
        if (message.type() === 'error') {
            browserErrors.push(message.text());
        }
    });

    await page.goto('/', {
        waitUntil: 'domcontentloaded'
    });

    await expect(page.locator('#hudOverlay')).toBeVisible();
    await expect(page.locator('#lobbyHud')).toBeVisible();
    await expect(
        page.locator(
            '#lobby-main:not([hidden]), #highScoresScreen:not([hidden])'
        )
    ).toBeVisible();

    await page.waitForTimeout(100);

    expect(browserErrors).toEqual([]);
});
