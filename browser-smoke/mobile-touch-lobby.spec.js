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

async function freezeHighScoreRotation(page, isoTime) {
    await page.addInitScript(function (fixedIsoTime) {
        const RealDate = Date;
        const fixedTime = new RealDate(fixedIsoTime).getTime();

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
        localStorage.setItem('gunfight-player-name', 'SAM');
    }, isoTime || '2026-01-01T00:00:00.000Z');
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
        await expect(page.locator('#touchHighScoresButton')).toBeVisible();
        await expect(page.locator('#touchPlayButton')).toBeHidden();
        await expect(page.locator('#touchEditButton')).toHaveText('EDIT NAME');
        await expect(page.locator('#touchHighScoresButton')).toHaveText(
            'HIGH SCORES'
        );

        const touchStyles = await page
            .locator('#touchLobbyControls')
            .evaluate(function (element) {
                const styles = window.getComputedStyle(element);

                return {
                    touchAction: styles.touchAction,
                    userSelect: styles.userSelect
                };
            });

        expect(touchStyles).toEqual({
            touchAction: 'none',
            userSelect: 'none'
        });

        const controlsBox = await page
            .locator('#touchLobbyControls')
            .boundingBox();

        if (!controlsBox) {
            throw new Error('Touch lobby controls should have a layout box');
        }

        expect(
            Math.abs(
                controlsBox.y +
                    controlsBox.height / 2 -
                    page.viewportSize().height / 2
            )
        ).toBeLessThan(2);

        const currentName = await page
            .locator('#lobbyPlayerLabels .lobby-player-label')
            .nth(1)
            .textContent();

        await page.locator('#touchEditButton').click();

        await expect(page.locator('#nameEditor')).toBeVisible();
        await expect(page.locator('#nameEditorValue')).toHaveText(
            'NAME: ' + currentName
        );

        expect(browserErrors).toEqual([]);
    });

    test('places touch buttons below the five-row high-score table', async ({
        page
    }) => {
        const browserErrors = captureBrowserErrors(page);

        await freezeHighScoreRotation(page, '2026-01-01T00:00:30.000Z');
        await page.setViewportSize({
            height: 390,
            width: 844
        });
        await page.goto('/?touch=1', {
            waitUntil: 'domcontentloaded'
        });

        if (await page.locator('#installPrompt').isVisible()) {
            await page
                .getByRole('button', {
                    name: 'Dismiss install instructions'
                })
                .click();
        }

        await expect(page.locator('#lobby-main')).toBeVisible();
        await page.locator('#touchHighScoresButton').click();

        await expect(page.locator('#highScoresScreen')).toBeVisible();
        await expect(
            page.locator('#highScoresTable .high-score-row')
        ).toHaveCount(6);
        await expect(page.locator('#highScoresTable')).toContainText('5TH');
        await expect(page.locator('#highScoresTable')).not.toContainText('6TH');
        await expect(page.locator('#touchLobbyControls')).toBeVisible();
        await expect(page.locator('#touchEditButton')).toBeHidden();
        await expect(page.locator('#touchHighScoresButton')).toBeHidden();
        await expect(page.locator('#touchPlayButton')).toBeHidden();
        await expect(page.locator('#touchBackButton')).toBeVisible();

        const tableBox = await page.locator('#highScoresTable').boundingBox();
        const controlsBox = await page
            .locator('#touchLobbyControls')
            .boundingBox();

        if (!tableBox || !controlsBox) {
            throw new Error(
                'High scores and touch controls should be laid out'
            );
        }

        expect(controlsBox.y).toBeGreaterThanOrEqual(
            tableBox.y + tableBox.height
        );

        await page.locator('#touchBackButton').click();
        await expect(page.locator('#lobby-main')).toBeVisible();

        expect(browserErrors).toEqual([]);
    });
});
