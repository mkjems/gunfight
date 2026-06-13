import { devices, expect, test } from '@playwright/test';

function captureBrowserErrors(page, label, browserErrors) {
    page.on('pageerror', function (error) {
        browserErrors.push(label + ': ' + error.message);
    });

    page.on('console', function (message) {
        if (message.type() === 'error') {
            browserErrors.push(label + ': ' + message.text());
        }
    });
}

async function preparePage(page) {
    await page.addInitScript(function () {
        window.__gunfightSocketEmits = [];
        window.__gunfightWrapIo = function (ioFactory) {
            if (ioFactory.__gunfightWrapped) {
                return ioFactory;
            }

            function wrappedIo(...args) {
                const socket = ioFactory(...args);
                const originalEmit = socket.emit.bind(socket);

                socket.emit = function (eventName, payload) {
                    window.__gunfightSocketEmits.push({
                        eventName,
                        payload
                    });

                    return originalEmit(eventName, payload);
                };

                return socket;
            }

            Object.assign(wrappedIo, ioFactory);
            wrappedIo.__gunfightWrapped = true;

            return wrappedIo;
        };

        Object.defineProperty(window, 'io', {
            configurable: true,
            get() {
                return this.__gunfightIo;
            },
            set(value) {
                this.__gunfightIo =
                    typeof value === 'function'
                        ? this.__gunfightWrapIo(value)
                        : value;
            }
        });

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
}

async function gotoPreparedLobby(page, url) {
    await preparePage(page);
    await page.goto(url, {
        waitUntil: 'domcontentloaded'
    });
}

async function getSocketEmits(page) {
    return page.evaluate(function () {
        return window.__gunfightSocketEmits || [];
    });
}

async function captureMobileScreenshot(page, testInfo, fileName) {
    await page.screenshot({
        fullPage: false,
        path: testInfo.outputPath(fileName)
    });
}

async function expectMobileAmmoInViewport(page) {
    const box = await page.locator('#ammoRow').boundingBox();
    const viewport = page.viewportSize();

    expect(box).not.toBeNull();
    expect(viewport).not.toBeNull();

    if (!box || !viewport) {
        return;
    }

    expect(box.x).toBeGreaterThanOrEqual(-1);
    expect(box.y).toBeGreaterThanOrEqual(-1);
    expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height + 1);
}

async function getAmmoBoxPositions(page) {
    const left = await page.locator('#ammoLeft').boundingBox();
    const right = await page.locator('#ammoRight').boundingBox();

    expect(left).not.toBeNull();
    expect(right).not.toBeNull();

    return {
        leftX: left ? left.x : 0,
        rightX: right ? right.x : 0
    };
}

function expectAmmoBoxesStable(before, after) {
    expect(Math.abs(after.leftX - before.leftX)).toBeLessThanOrEqual(1);
    expect(Math.abs(after.rightX - before.rightX)).toBeLessThanOrEqual(1);
}

async function clickTouchControl(page, locator) {
    const box = await locator.boundingBox();

    if (!box) {
        throw new Error('Touch control is missing a bounding box');
    }

    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
}

async function dragTouchControl(page, locator, offsetX, offsetY) {
    const box = await locator.boundingBox();

    if (!box) {
        throw new Error('Touch control is missing a bounding box');
    }

    const centerX = box.x + box.width / 2;
    const centerY = box.y + box.height / 2;

    await page.mouse.move(centerX, centerY);
    await page.mouse.down();
    await page.mouse.move(centerX + offsetX, centerY + offsetY, {
        steps: 4
    });
    await page.mouse.up();
}

function hasKeyEmit(emits, key, action) {
    return emits.some(function (entry) {
        return (
            entry.eventName === 'clientKeyEvent' &&
            entry.payload &&
            entry.payload.key === key &&
            entry.payload.action === action
        );
    });
}

test('desktop and mobile clients can ready up and reach gameplay', async ({
    browser
}, testInfo) => {
    const browserErrors = [];
    const desktopContext = await browser.newContext({
        viewport: {
            height: 720,
            width: 1100
        }
    });
    const mobileContext = await browser.newContext({
        deviceScaleFactor: devices['iPhone 13'].deviceScaleFactor,
        hasTouch: true,
        isMobile: true,
        userAgent: devices['iPhone 13'].userAgent,
        viewport: {
            height: 390,
            width: 844
        }
    });

    const desktop = await desktopContext.newPage();
    const mobile = await mobileContext.newPage();

    captureBrowserErrors(desktop, 'desktop', browserErrors);
    captureBrowserErrors(mobile, 'mobile', browserErrors);

    await Promise.all([
        gotoPreparedLobby(desktop, '/'),
        gotoPreparedLobby(mobile, '/?touch=1')
    ]);

    await Promise.all([
        expect(desktop.locator('#lobbyPlayerLabels')).toContainText('YOU'),
        expect(desktop.locator('#lobbyPlayerLabels')).not.toContainText(
            'PLAYER 2 -'
        ),
        expect(mobile.locator('#touchLobbyControls')).toBeVisible(),
        expect(mobile.locator('#touchPlayButton')).toBeVisible()
    ]);
    await captureMobileScreenshot(mobile, testInfo, 'mobile-01-lobby.png');

    await desktop.keyboard.press('p');
    await mobile.locator('#touchPlayButton').click();

    await Promise.all([
        expect(desktop.locator('#roundMessage')).toHaveText('GET READY'),
        expect(mobile.locator('#roundMessage')).toHaveText('GET READY')
    ]);
    await captureMobileScreenshot(mobile, testInfo, 'mobile-02-get-ready.png');

    await Promise.all([
        expect(desktop.locator('#roundMessage')).toHaveText('DRAW!'),
        expect(mobile.locator('#roundMessage')).toHaveText('DRAW!')
    ]);
    await captureMobileScreenshot(mobile, testInfo, 'mobile-03-draw.png');

    await Promise.all([
        expect(desktop.locator('#roundMessage')).toHaveText(''),
        expect(mobile.locator('#roundMessage')).toHaveText('')
    ]);

    await Promise.all([
        expect(desktop.locator('#gameHud')).toBeVisible(),
        expect(desktop.locator('#scoreRow')).toBeVisible(),
        expect(desktop.locator('#scoreLeft .scoreValue')).toHaveText('0'),
        expect(desktop.locator('#scoreRight .scoreValue')).toHaveText('0'),
        expect(desktop.locator('#scoreLeft .scoreName')).not.toHaveText(''),
        expect(desktop.locator('#scoreRight .scoreName')).not.toHaveText(''),
        expect(desktop.locator('#ammoLeft .ammoRound')).toHaveCount(6),
        expect(desktop.locator('#ammoRight .ammoRound')).toHaveCount(6),
        expect(mobile.locator('#gameHud')).toBeVisible(),
        expect(mobile.locator('#scoreRow')).toBeVisible(),
        expect(mobile.locator('#scoreLeft .scoreValue')).toHaveText('0'),
        expect(mobile.locator('#scoreRight .scoreValue')).toHaveText('0'),
        expect(mobile.locator('#scoreLeft .scoreName')).not.toHaveText(''),
        expect(mobile.locator('#scoreRight .scoreName')).not.toHaveText(''),
        expect(mobile.locator('#ammoRow')).toBeVisible(),
        expect(mobile.locator('#ammoLeft .ammoRound')).toHaveCount(6),
        expect(mobile.locator('#ammoRight .ammoRound')).toHaveCount(6),
        expect(mobile.locator('#touchJoystick')).toBeVisible(),
        expect(mobile.locator('#touchAimSlider')).toBeVisible(),
        expect(mobile.locator('#touchShootButton')).toBeVisible()
    ]);
    await expectMobileAmmoInViewport(mobile);
    await captureMobileScreenshot(mobile, testInfo, 'mobile-04-gameplay.png');
    const mobileAmmoBeforeShots = await getAmmoBoxPositions(mobile);

    await desktop.keyboard.down('h');
    await desktop.keyboard.up('h');
    await desktop.keyboard.press('Space');
    await dragTouchControl(mobile, mobile.locator('#touchJoystick'), 60, 0);
    await clickTouchControl(mobile, mobile.locator('#touchShootButton'));

    await expect
        .poll(async function () {
            const emits = await getSocketEmits(desktop);

            return (
                hasKeyEmit(emits, 'h', 'down') &&
                hasKeyEmit(emits, 'h', 'up') &&
                hasKeyEmit(emits, ' ', 'down') &&
                hasKeyEmit(emits, ' ', 'up')
            );
        })
        .toBe(true);

    expectAmmoBoxesStable(
        mobileAmmoBeforeShots,
        await getAmmoBoxPositions(mobile)
    );

    await expect
        .poll(async function () {
            const emits = await getSocketEmits(mobile);

            return (
                emits.some(function (entry) {
                    return entry.eventName === 'clientReady';
                }) &&
                hasKeyEmit(emits, 'l', 'down') &&
                hasKeyEmit(emits, 'l', 'up') &&
                hasKeyEmit(emits, ' ', 'down') &&
                hasKeyEmit(emits, ' ', 'up')
            );
        })
        .toBe(true);

    expect(browserErrors).toEqual([]);

    await desktopContext.close();
    await mobileContext.close();
});
