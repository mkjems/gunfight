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

test('built browser app renders the high scores component island', async ({
    page
}) => {
    const browserErrors = [];

    page.on('pageerror', function (error) {
        browserErrors.push(error.message);
    });

    page.on('console', function (message) {
        if (message.type() === 'error') {
            browserErrors.push(message.text());
        }
    });

    await page.addInitScript(function () {
        const RealDate = Date;
        const fixedTime = new RealDate('2026-01-01T00:00:07.000Z').getTime();

        class FixedDate extends RealDate {
            constructor(...args) {
                if (args.length) {
                    super(...args);
                    return;
                }

                super(fixedTime);
            }

            static now() {
                return fixedTime;
            }
        }

        FixedDate.UTC = RealDate.UTC;
        FixedDate.parse = RealDate.parse;
        globalThis.Date = FixedDate;
        localStorage.setItem('gunfight-install-prompt-dismissed', '1');
    });

    await page.goto('/', {
        waitUntil: 'domcontentloaded'
    });

    await expect(page.locator('#highScoresScreen')).toBeVisible();
    await expect(
        page.locator('#highScoresTable .high-score-row.is-header')
    ).toContainText('NAME');
    await expect(page.locator('#highScoresTable .high-score-empty')).toHaveText(
        'NO SCORES YET'
    );

    expect(browserErrors).toEqual([]);
});
