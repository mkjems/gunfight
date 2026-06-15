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

async function preparePage(page, options = {}) {
    await page.addInitScript(function (setupOptions) {
        window.__gunfightSocketEmits = [];
        window.__gunfightSocketEvents = [];
        window.__gunfightSockets = [];
        window.__gunfightWrapIo = function (ioFactory) {
            if (ioFactory.__gunfightWrapped) {
                return ioFactory;
            }

            function wrappedIo(...args) {
                const socket = ioFactory(...args);
                const originalEmit = socket.emit.bind(socket);
                const originalOn = socket.on.bind(socket);

                socket.emit = function (eventName, payload) {
                    window.__gunfightSocketEmits.push({
                        eventName,
                        payload
                    });

                    return originalEmit(eventName, payload);
                };

                socket.on = function (eventName, handler) {
                    return originalOn(eventName, function (...eventArgs) {
                        const payload = eventArgs[0];

                        window.__gunfightSocketEvents.push({
                            eventName,
                            payload
                        });

                        if (eventName === 'joinedGame') {
                            window.__gunfightJoinedGame = payload;
                            window.__gunfightLatestModel = payload.model;
                        } else if (
                            eventName === 'modelUpdate' ||
                            eventName === 'newClient'
                        ) {
                            window.__gunfightLatestModel = payload;
                        }

                        return handler(...eventArgs);
                    });
                };

                window.__gunfightSockets.push(socket);

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

        if (setupOptions.freezeDate !== false) {
            const RealDate = Date;
            const fixedTime = new RealDate(
                '2026-01-01T00:00:00.000Z'
            ).getTime();

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
        }

        localStorage.setItem('gunfight-install-prompt-dismissed', '1');
    }, options);
}

async function gotoPreparedLobby(page, url, options) {
    await preparePage(page, options);
    await page.goto(url, {
        waitUntil: 'domcontentloaded'
    });
}

async function getSocketEmits(page) {
    return page.evaluate(function () {
        return window.__gunfightSocketEmits || [];
    });
}

async function getSocketEvents(page) {
    return page.evaluate(function () {
        return window.__gunfightSocketEvents || [];
    });
}

async function getLatestModel(page) {
    return page.evaluate(function () {
        return window.__gunfightLatestModel || null;
    });
}

async function waitForPhase(page, phase) {
    await page.waitForFunction(function (expectedPhase) {
        return window.__gunfightLatestModel?.phase === expectedPhase;
    }, phase);

    return getLatestModel(page);
}

async function waitForClientCount(page, count) {
    await page.waitForFunction(function (expectedCount) {
        return window.__gunfightLatestModel?.clients?.length === expectedCount;
    }, count);

    return getLatestModel(page);
}

async function waitForLocalReady(page) {
    await expect
        .poll(async function () {
            return page.evaluate(function () {
                const joined = window.__gunfightJoinedGame;
                const model = window.__gunfightLatestModel;
                const client =
                    joined &&
                    model?.clients?.find(function (item) {
                        return item.id === joined.playerId;
                    });

                return !!client?.ready;
            });
        })
        .toBe(true);
}

async function waitForScore(page, scoreLabel) {
    await expect
        .poll(async function () {
            const model = await getLatestModel(page);

            return model?.scores?.join('-') || '';
        })
        .toBe(scoreLabel);
}

async function getExpectedScoreForWinner(page, winnerId) {
    return page.evaluate(function (id) {
        const model = window.__gunfightLatestModel;

        return model.clients
            .map(function (client) {
                return client.id === id ? 1 : 0;
            })
            .join('-');
    }, winnerId);
}

function getWinningScoreSelector(scoreLabel) {
    return scoreLabel.indexOf('1-') === 0
        ? '#scoreLeft .scoreValue'
        : '#scoreRight .scoreValue';
}

async function createRoundResultPayload(page) {
    return page.evaluate(function () {
        const joined = window.__gunfightJoinedGame;
        const model = window.__gunfightLatestModel;
        const target = model.clients.find(function (client) {
            return client.id !== joined.playerId;
        });

        return {
            roundNumber: model.roundNumber,
            targetId: target.id,
            winnerId: joined.playerId
        };
    });
}

async function emitRoundResult(page, payload) {
    await page.evaluate(function (resultPayload) {
        window.__gunfightSockets[0].emit('roundResult', resultPayload);
    }, payload);
}

async function captureMobileScreenshot(page, testInfo, fileName) {
    await page.screenshot({
        fullPage: false,
        path: testInfo.outputPath(fileName)
    });
}

async function focusPageForKeyboard(page) {
    await page.bringToFront();
    await page.locator('body').click({
        position: {
            x: 20,
            y: 20
        }
    });
}

async function openNameEditorWithKeyboard(page) {
    await focusPageForKeyboard(page);
    await page.keyboard.press('e');
}

async function readyWithKeyboard(page) {
    await focusPageForKeyboard(page);
    await page.keyboard.press('p');
    await waitForLocalReady(page);
}

async function readyWithTouch(page) {
    await page.locator('#touchPlayButton').click();
    await waitForLocalReady(page);
}

async function selectNameEditorKey(page, value) {
    await page
        .locator('#nameEditorGrid')
        .getByRole('button', {
            exact: true,
            name: value
        })
        .click();
}

async function replaceName(page, name) {
    await expect(page.locator('#nameEditor')).toBeVisible();

    for (let i = 0; i < 8; i++) {
        await selectNameEditorKey(page, 'DEL');
    }

    for (const character of name) {
        await selectNameEditorKey(page, character);
    }

    await selectNameEditorKey(page, 'OK');
    await expect(page.locator('#nameEditor')).toBeHidden();
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

async function getYouLabelBox(page) {
    const box = await page
        .locator('#lobbyPlayerLabels .lobby-player-label')
        .filter({
            hasText: '(YOU)'
        })
        .first()
        .boundingBox();

    expect(box).not.toBeNull();

    return (
        box || {
            height: 0,
            width: 0,
            x: 0,
            y: 0
        }
    );
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

    await gotoPreparedLobby(desktop, '/', {
        freezeDate: false
    });
    await gotoPreparedLobby(mobile, '/?touch=1', {
        freezeDate: false
    });
    await Promise.all([
        waitForClientCount(desktop, 2),
        waitForClientCount(mobile, 2)
    ]);

    await Promise.all([
        expect(desktop.locator('#lobbyPlayerLabels')).toContainText('(YOU)'),
        expect(desktop.locator('#lobbyPlayerLabels')).not.toContainText(
            'PLAYER 2 -'
        ),
        expect(mobile.locator('#touchLobbyControls')).toBeVisible(),
        expect(mobile.locator('#touchPlayButton')).toBeVisible()
    ]);
    await captureMobileScreenshot(mobile, testInfo, 'mobile-01-lobby.png');

    await openNameEditorWithKeyboard(desktop);
    await replaceName(desktop, 'NOVA');
    await mobile.locator('#touchEditButton').click();
    await replaceName(mobile, 'ZED');

    await Promise.all([
        expect(desktop.locator('#lobbyPlayerLabels')).toContainText('NOVA'),
        expect(desktop.locator('#lobbyPlayerLabels')).toContainText('ZED'),
        expect(mobile.locator('#lobbyPlayerLabels')).toContainText('NOVA'),
        expect(mobile.locator('#lobbyPlayerLabels')).toContainText('ZED')
    ]);

    await readyWithKeyboard(desktop);
    await readyWithTouch(mobile);

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
        expect(desktop.locator('#scoreLeft .scoreName')).toHaveText('NOVA'),
        expect(desktop.locator('#scoreRight .scoreName')).toHaveText('ZED'),
        expect(desktop.locator('#ammoLeft .ammoRound')).toHaveCount(6),
        expect(desktop.locator('#ammoRight .ammoRound')).toHaveCount(6),
        expect(mobile.locator('#gameHud')).toBeVisible(),
        expect(mobile.locator('#scoreRow')).toBeVisible(),
        expect(mobile.locator('#scoreLeft .scoreValue')).toHaveText('0'),
        expect(mobile.locator('#scoreRight .scoreValue')).toHaveText('0'),
        expect(mobile.locator('#scoreLeft .scoreName')).toHaveText('NOVA'),
        expect(mobile.locator('#scoreRight .scoreName')).toHaveText('ZED'),
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

test('server hit pause holds score until next round and server game over returns to lobby', async ({
    browser
}) => {
    test.setTimeout(60000);

    const browserErrors = [];
    const contextA = await browser.newContext({
        viewport: {
            height: 720,
            width: 1100
        }
    });
    const contextB = await browser.newContext({
        viewport: {
            height: 720,
            width: 1100
        }
    });
    const playerA = await contextA.newPage();
    const playerB = await contextB.newPage();

    captureBrowserErrors(playerA, 'playerA', browserErrors);
    captureBrowserErrors(playerB, 'playerB', browserErrors);

    await gotoPreparedLobby(playerA, '/', {
        freezeDate: false
    });
    await gotoPreparedLobby(playerB, '/', {
        freezeDate: false
    });
    await Promise.all([
        waitForClientCount(playerA, 2),
        waitForClientCount(playerB, 2)
    ]);

    await openNameEditorWithKeyboard(playerA);
    await replaceName(playerA, 'NOVA');
    await openNameEditorWithKeyboard(playerB);
    await replaceName(playerB, 'ZED');

    await readyWithKeyboard(playerA);
    await readyWithKeyboard(playerB);
    await Promise.all([
        waitForPhase(playerA, 'playing'),
        waitForPhase(playerB, 'playing')
    ]);

    const roundResult = await createRoundResultPayload(playerA);
    const expectedScore = await getExpectedScoreForWinner(
        playerA,
        roundResult.winnerId
    );
    const winningScoreSelector = getWinningScoreSelector(expectedScore);

    await emitRoundResult(playerA, roundResult);
    await Promise.all([
        waitForPhase(playerA, 'hitPause'),
        waitForPhase(playerB, 'hitPause'),
        waitForScore(playerA, expectedScore),
        waitForScore(playerB, expectedScore),
        expect(playerA.locator(winningScoreSelector)).toHaveText('1'),
        expect(playerB.locator(winningScoreSelector)).toHaveText('1')
    ]);

    const [roundIntroModelA, roundIntroModelB] = await Promise.all([
        waitForPhase(playerA, 'roundIntro'),
        waitForPhase(playerB, 'roundIntro')
    ]);

    expect(roundIntroModelA.roundNumber).toBe(roundResult.roundNumber + 1);
    expect(roundIntroModelB.roundNumber).toBe(roundResult.roundNumber + 1);
    expect(roundIntroModelA.scores.join('-')).toBe(expectedScore);
    expect(roundIntroModelB.scores.join('-')).toBe(expectedScore);

    await Promise.all([
        expect(playerA.locator(winningScoreSelector)).toHaveText('1'),
        expect(playerB.locator(winningScoreSelector)).toHaveText('1')
    ]);

    await Promise.all([
        waitForPhase(playerA, 'gameOver'),
        waitForPhase(playerB, 'gameOver')
    ]);
    await Promise.all([
        expect(playerA.locator('#roundMessage')).toContainText(
            'WINS ' + expectedScore
        ),
        expect(playerB.locator('#roundMessage')).toContainText(
            'WINS ' + expectedScore
        )
    ]);

    await Promise.all([
        waitForPhase(playerA, 'readying'),
        waitForPhase(playerB, 'readying')
    ]);
    await Promise.all([
        expect(playerA.locator('#lobby-main')).toBeVisible(),
        expect(playerB.locator('#lobby-main')).toBeVisible(),
        expect(playerA.locator('#lobbyPlayPrompt')).toHaveText(
            'PRESS P TO PLAY'
        ),
        expect(playerB.locator('#lobbyPlayPrompt')).toHaveText(
            'PRESS P TO PLAY'
        )
    ]);

    expect(browserErrors).toEqual([]);

    await contextA.close();
    await contextB.close();
});

test('abandoned games requeue safely and reject late round reports', async ({
    browser
}) => {
    test.setTimeout(45000);

    const browserErrors = [];
    const contextA = await browser.newContext({
        viewport: {
            height: 720,
            width: 1100
        }
    });
    const contextB = await browser.newContext({
        viewport: {
            height: 720,
            width: 1100
        }
    });
    const playerA = await contextA.newPage();
    const playerB = await contextB.newPage();

    captureBrowserErrors(playerA, 'playerA', browserErrors);
    captureBrowserErrors(playerB, 'playerB', browserErrors);

    await gotoPreparedLobby(playerA, '/', {
        freezeDate: false
    });
    await gotoPreparedLobby(playerB, '/', {
        freezeDate: false
    });
    await Promise.all([
        waitForClientCount(playerA, 2),
        waitForClientCount(playerB, 2)
    ]);

    await readyWithKeyboard(playerA);
    await readyWithKeyboard(playerB);
    await waitForPhase(playerA, 'playing');

    const staleRoundResult = await createRoundResultPayload(playerA);

    await playerB.close();
    const abandonedModel = await waitForPhase(playerA, 'abandoned');

    expect(abandonedModel.message).toBe('OPPONENT LEFT');

    const eventsBeforeLateReport = (await getSocketEvents(playerA)).length;

    await emitRoundResult(playerA, staleRoundResult);
    await playerA.waitForTimeout(300);

    expect((await getSocketEvents(playerA)).length).toBe(
        eventsBeforeLateReport
    );

    await waitForPhase(playerA, 'waiting');
    await expect(playerA.locator('#lobbyPlayerLabels')).toContainText(
        'LOOKING FOR OPPONENT'
    );

    const emits = await getSocketEmits(playerA);

    expect(
        emits.some(function (entry) {
            return entry.eventName === 'requeue';
        })
    ).toBe(true);
    expect(browserErrors).toEqual([]);

    await contextA.close();
    await contextB.close();
});

test('alone waiting clients are auto paired after opponents leave', async ({
    browser
}) => {
    const browserErrors = [];
    const contextA = await browser.newContext({
        viewport: {
            height: 720,
            width: 1100
        }
    });
    const contextB = await browser.newContext({
        viewport: {
            height: 720,
            width: 1100
        }
    });
    const contextC = await browser.newContext({
        viewport: {
            height: 720,
            width: 1100
        }
    });
    const contextD = await browser.newContext({
        viewport: {
            height: 720,
            width: 1100
        }
    });
    const playerA = await contextA.newPage();
    const playerB = await contextB.newPage();
    const playerC = await contextC.newPage();
    const playerD = await contextD.newPage();

    captureBrowserErrors(playerA, 'playerA', browserErrors);
    captureBrowserErrors(playerB, 'playerB', browserErrors);
    captureBrowserErrors(playerC, 'playerC', browserErrors);
    captureBrowserErrors(playerD, 'playerD', browserErrors);

    await gotoPreparedLobby(playerA, '/', {
        freezeDate: false
    });
    await gotoPreparedLobby(playerB, '/', {
        freezeDate: false
    });
    await expect(playerA.locator('#lobbyPlayPrompt')).toHaveText(
        'PRESS P TO PLAY'
    );

    await gotoPreparedLobby(playerC, '/', {
        freezeDate: false
    });
    await gotoPreparedLobby(playerD, '/', {
        freezeDate: false
    });
    await expect(playerC.locator('#lobbyPlayPrompt')).toHaveText(
        'PRESS P TO PLAY'
    );

    await playerB.close();
    await expect(playerA.locator('#lobbyPlayPrompt')).toHaveText('');
    await playerD.close();

    await Promise.all([
        expect(playerA.locator('#lobbyPlayPrompt')).toHaveText(
            'PRESS P TO PLAY'
        ),
        expect(playerC.locator('#lobbyPlayPrompt')).toHaveText(
            'PRESS P TO PLAY'
        ),
        expect(playerA.locator('#lobbyPlayerLabels')).not.toContainText(
            'LOOKING FOR OPPONENT'
        ),
        expect(playerC.locator('#lobbyPlayerLabels')).not.toContainText(
            'LOOKING FOR OPPONENT'
        )
    ]);

    await playerC.bringToFront();
    await playerC.locator('body').click({
        position: {
            x: 20,
            y: 20
        }
    });

    const playerCBeforeMove = await getYouLabelBox(playerC);

    await playerC.keyboard.down('h');
    await playerC.waitForTimeout(200);
    await playerC.keyboard.up('h');

    const playerCAfterMove = await getYouLabelBox(playerC);

    expect(playerCAfterMove.x).toBeLessThan(playerCBeforeMove.x - 1);

    await readyWithKeyboard(playerA);
    await readyWithKeyboard(playerC);

    await Promise.all([
        expect(playerA.locator('#roundMessage')).toHaveText('GET READY'),
        expect(playerC.locator('#roundMessage')).toHaveText('GET READY')
    ]);

    expect(browserErrors).toEqual([]);

    await contextA.close();
    await contextC.close();
    await contextB.close();
    await contextD.close();
});
