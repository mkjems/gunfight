import { devices, expect, test } from '@playwright/test';

test.use({
    deviceScaleFactor: devices['iPhone 13'].deviceScaleFactor,
    hasTouch: true,
    isMobile: true,
    userAgent: devices['iPhone 13'].userAgent,
    viewport: {
        height: 844,
        width: 390
    }
});

function captureBrowserErrors(page) {
    const browserErrors = [];

    page.on('pageerror', function (error) {
        browserErrors.push(error.message);
    });

    page.on('console', function (message) {
        if (message.type() === 'error') {
            browserErrors.push(message.text());
        }
    });

    return browserErrors;
}

async function freezeHighScoreRotation(page) {
    await page.addInitScript(function () {
        const RealDate = Date;
        const fixedTime = new RealDate('2026-01-01T00:00:00.000Z').getTime();

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
    });
}

test.describe('mobile touch lobby', function () {
    test('shows touch lobby buttons after rotating from portrait to landscape', async ({
        page
    }) => {
        const browserErrors = captureBrowserErrors(page);

        await freezeHighScoreRotation(page);
        await page.setViewportSize({
            height: 844,
            width: 390
        });
        await page.goto('/?touch=1', {
            waitUntil: 'domcontentloaded'
        });

        await expect(page.locator('#rotatePrompt')).toBeVisible();

        await page.setViewportSize({
            height: 390,
            width: 844
        });

        await expect(page.locator('#rotatePrompt')).not.toBeVisible();

        if (await page.locator('#installPrompt').isVisible()) {
            await page
                .getByRole('button', {
                    name: 'Dismiss install instructions'
                })
                .click();
        }

        await expect(page.locator('#lobbyHud')).toBeVisible();
        await expect(page.locator('#lobby-main')).toBeVisible();
        await expect(page.locator('#touchLobbyControls')).toBeVisible();
        await expect(page.locator('#touchEditButton')).toBeVisible();
        await expect(page.locator('#touchPlayButton')).toBeVisible();
        await expect(page.locator('#touchEditButton')).toHaveText('EDIT NAME');
        await expect(page.locator('#touchPlayButton')).toHaveText('TAP PLAY');

        expect(browserErrors).toEqual([]);
    });
});
