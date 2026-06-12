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
    });

    await page.goto('/', {
        waitUntil: 'domcontentloaded'
    });

    await expect(page.locator('#highScoresScreen')).toBeVisible();
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
    await expect(page.locator('#lobbyPlayerLabels')).toContainText('PLAYER 1');
    await expect(page.locator('#lobbyPlayerLabels')).toContainText('WAITING');
    await expect(page.locator('#lobbyPlayPrompt')).toHaveText(
        'PRESS P TO PLAY'
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
    await page.keyboard.press('e');

    await expect(page.locator('#nameEditor')).toBeVisible();
    await expect(page.locator('#nameEditorValue')).toHaveText('NAME:  ');
    await expect(page.locator('#nameEditorGrid .name-editor-row')).toHaveCount(
        5
    );
    await expect(
        page.locator('#nameEditorGrid .name-editor-key').first()
    ).toHaveText('A');
    await expect(page.locator('#nameEditorHelp')).toContainText('SPACE SELECT');

    expect(browserErrors).toEqual([]);
});
