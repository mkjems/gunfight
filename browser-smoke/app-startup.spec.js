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
    await expect(page.locator('#particleCanvas')).toBeVisible();
    await expect(page.locator('#particleCanvas')).toHaveCSS(
        'pointer-events',
        'none'
    );
    const particleCanvasIsLayered = await page.evaluate(function () {
        const canvas = document.getElementById('canvas');
        const particleCanvas = document.getElementById('particleCanvas');
        const hudOverlay = document.getElementById('hudOverlay');

        if (!canvas || !particleCanvas || !hudOverlay) {
            return false;
        }

        return (
            Number(getComputedStyle(canvas).zIndex) <
                Number(getComputedStyle(particleCanvas).zIndex) &&
            Number(getComputedStyle(particleCanvas).zIndex) <
                Number(getComputedStyle(hudOverlay).zIndex)
        );
    });

    expect(particleCanvasIsLayered).toBe(true);
    await expect(
        page.locator(
            '#lobby-main:not([hidden]), #highScoresScreen:not([hidden])'
        )
    ).toBeVisible();

    await page.waitForTimeout(100);

    expect(browserErrors).toEqual([]);
});

test('built browser app renders high scores through the app root', async ({
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
        const fixedTime = new RealDate('2026-01-01T00:00:30.000Z').getTime();

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
    });

    await page.goto('/', {
        waitUntil: 'domcontentloaded'
    });

    await expect(page.locator('#lobby-main')).toBeVisible();

    await page.keyboard.press('s');

    await expect(page.locator('#highScoresScreen')).toBeVisible();
    await expect(page.locator('#highScoresBackPrompt')).toHaveText(
        'PRESS S TO RETURN TO LOBBY'
    );
    await expect(
        page.locator('#highScoresTable .high-score-row.is-header')
    ).toContainText('NAME');
    await expect(page.locator('#highScoresTable .high-score-row')).toHaveCount(
        11
    );
    await expect(page.locator('#highScoresTable')).not.toContainText(
        'NO SCORES YET'
    );
    await expect(page.locator('#highScoresTable')).toContainText('10TH');

    await page.keyboard.press('s');

    await expect(page.locator('#lobby-main')).toBeVisible();

    expect(browserErrors).toEqual([]);
});

test('built browser app renders lobby through the app root', async ({
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
        localStorage.setItem('gunfight-install-prompt-dismissed', '1');
    });

    await page.goto('/', {
        waitUntil: 'domcontentloaded'
    });

    await expect(page.locator('#lobby-main')).toBeVisible();
    await expect(page.locator('#lobby-main h1')).toHaveText('GUNFIGHT 1975');
    await expect(page.locator('#lobbyIdentity')).toHaveCount(0);
    await expect(page.locator('#lobbySlots')).toHaveCount(0);
    await expect(page.locator('#lobbyControlsText')).toContainText(
        'h j k l - left down up right'
    );
    await expect(page.locator('#lobbyPlayerLabels')).toContainText('YOU');
    await expect(page.locator('#lobbyPlayerLabels')).toContainText('WAITING');
    await expect(page.locator('#lobbyPlayerLabels')).toContainText('?');
    await expect(page.locator('#lobbyPlayerLabels')).toContainText(
        'LOOKING FOR OPPONENT'
    );
    await expect(page.locator('#lobbyPlayerLabels')).not.toContainText(
        'PLAYER 1 -'
    );
    await expect(page.locator('#lobbyPlayPrompt')).toHaveText('');
    await expect(page.locator('#lobbyHighScoresPrompt')).toHaveText(
        'S - HIGH SCORES'
    );

    expect(browserErrors).toEqual([]);
});

test('built browser app renders the name editor through the app root', async ({
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
        localStorage.setItem('gunfight-install-prompt-dismissed', '1');
    });

    await page.goto('/', {
        waitUntil: 'domcontentloaded'
    });

    await expect(page.locator('#lobby-main')).toBeVisible();
    const currentName = await page
        .locator('#lobbyPlayerLabels .lobby-player-label')
        .nth(1)
        .textContent();
    await page.keyboard.press('e');

    await expect(page.locator('#nameEditor')).toBeVisible();
    await expect(page.locator('#nameEditorValue')).toHaveText(
        'NAME: ' + currentName
    );
    await expect(page.locator('#nameEditorGrid .name-editor-row')).toHaveCount(
        5
    );
    await expect(
        page.locator('#nameEditorGrid .name-editor-key').first()
    ).toHaveText('A');
    await expect(page.locator('#nameEditorHelp')).toContainText('SPACE SELECT');

    expect(browserErrors).toEqual([]);
});

test('built browser app renders the rock editor page', async ({ page }) => {
    const browserErrors = [];

    page.on('pageerror', function (error) {
        browserErrors.push(error.message);
    });

    page.on('console', function (message) {
        if (message.type() === 'error') {
            browserErrors.push(message.text());
        }
    });

    await page.setViewportSize({ width: 1440, height: 700 });
    await page.goto('/rock-editor', {
        waitUntil: 'domcontentloaded'
    });

    const stylesheetPaths = await page.evaluate(function () {
        return Array.from(
            document.querySelectorAll('link[rel="stylesheet"]')
        ).map(function (link) {
            return new URL(link.href).pathname;
        });
    });

    expect(
        stylesheetPaths.some(function (path) {
            return path.endsWith('/rock-editor.css');
        })
    ).toBe(true);
    expect(
        stylesheetPaths.some(function (path) {
            return path.endsWith('/index.css');
        })
    ).toBe(false);

    await expect(page.locator('#rockEditor')).toBeVisible();
    await expect(page.locator('#rockTypeSelect')).toHaveValue('small');
    const initialValidationText = await page
        .locator('#rockValidation')
        .textContent();

    expect(initialValidationText?.trim().length).toBeGreaterThan(0);
    await expect(page.locator('#rockJsonOutput')).toHaveValue(/"small"/);
    await expect(page.locator('#rockJsonOutput')).toHaveValue(/"tall"/);

    const canvasHasPixels = await page
        .locator('#rockEditorCanvas')
        .evaluate(function (canvas) {
            const context = canvas.getContext('2d');

            if (!context) {
                return false;
            }

            const pixels = context.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
            ).data;

            for (let index = 0; index < pixels.length; index += 4) {
                if (
                    pixels[index] !== 0 ||
                    pixels[index + 1] !== 0 ||
                    pixels[index + 2] !== 0
                ) {
                    return true;
                }
            }

            return false;
        });

    expect(canvasHasPixels).toBe(true);

    const editorPageScrolls = await page.evaluate(function () {
        const scroller = document.scrollingElement;

        if (!scroller || scroller.scrollHeight <= scroller.clientHeight) {
            return false;
        }

        window.scrollTo(0, scroller.scrollHeight);
        const scrolled = window.scrollY > 0;

        window.scrollTo(0, 0);

        return scrolled;
    });

    expect(editorPageScrolls).toBe(true);

    await page.locator('#rockJsonInput').fill('{');
    await page.locator('#rockLoadJsonButton').click();
    await expect(page.locator('#rockValidation')).toContainText('Input JSON');

    await page.locator('#rockJsonInput').fill(
        JSON.stringify({
            lines: [
                { from: [0, 0], to: [20, 0] },
                { from: [20, 0], to: [20, 20] },
                { from: [20, 20], to: [0, 20] },
                { from: [0, 20], to: [0, 0] }
            ]
        })
    );
    await page.locator('#rockLoadJsonButton').click();
    await expect(page.locator('#rockTypeSelect')).toHaveValue('small');
    await expect(page.locator('#rockJsonOutput')).toHaveValue(/"small"/);
    await expect(page.locator('#rockValidation')).toContainText(
        'Valid rock JSON.'
    );

    expect(browserErrors).toEqual([]);
});
