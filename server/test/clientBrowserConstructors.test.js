import assert from 'node:assert/strict';
import {
    mkdirSync,
    mkdtempSync,
    readFileSync,
    rmSync,
    writeFileSync
} from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import ts from 'typescript';

function compileClientModule(sourceName, outputName, tempDirectory) {
    const source = readFileSync(
        path.join(process.cwd(), 'client/src', sourceName),
        'utf8'
    );
    const transpiled = ts.transpileModule(source, {
        compilerOptions: {
            jsx: ts.JsxEmit.ReactJSX,
            jsxImportSource: 'preact',
            module: ts.ModuleKind.ES2022,
            target: ts.ScriptTarget.ES2022
        },
        fileName: sourceName
    });

    const outputPath = path.join(tempDirectory, outputName);

    mkdirSync(path.dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, transpiled.outputText, 'utf8');
}

async function loadBrowserConstructors() {
    const cacheDirectory = path.join(process.cwd(), 'node_modules', '.cache');
    mkdirSync(cacheDirectory, { recursive: true });

    const tempDirectory = mkdtempSync(
        path.join(cacheDirectory, 'gunfight-browser-constructors-')
    );

    compileClientModule(
        'ui/componentRenderProps.ts',
        'ui/componentRenderProps.js',
        tempDirectory
    );
    compileClientModule(
        'platform/config.ts',
        'platform/config.js',
        tempDirectory
    );
    compileClientModule('engine/camera.ts', 'engine/camera.js', tempDirectory);
    compileClientModule(
        'platform/soundEffects.ts',
        'platform/soundEffects.js',
        tempDirectory
    );
    compileClientModule(
        'input/touchControls.ts',
        'input/touchControls.js',
        tempDirectory
    );
    compileClientModule(
        'ui/components/touchGameplayControlsComponentScreen.tsx',
        'ui/components/touchGameplayControlsComponentScreen.js',
        tempDirectory
    );
    compileClientModule(
        'ui/components/touchLobbyControlsComponentScreen.tsx',
        'ui/components/touchLobbyControlsComponentScreen.js',
        tempDirectory
    );

    try {
        const [cameraModule, soundModule, touchModule] = await Promise.all(
            [
                'engine/camera.js',
                'platform/soundEffects.js',
                'input/touchControls.js'
            ].map(function (fileName) {
                return import(
                    pathToFileURL(path.join(tempDirectory, fileName)).href
                );
            })
        );

        return {
            Camera: cameraModule.Camera,
            SoundEffects: soundModule.SoundEffects,
            TouchControls: touchModule.TouchControls
        };
    } finally {
        rmSync(tempDirectory, { force: true, recursive: true });
    }
}

function createTouchElement(id) {
    return {
        classList: {
            classes: {},
            toggle(className, force) {
                this.classes[className] = !!force;
            }
        },
        hidden: false,
        id,
        listeners: {},
        pointerCapture: null,
        rect: {
            height: 100,
            left: 0,
            top: 0,
            width: 100
        },
        style: {},
        addEventListener(eventName, callback) {
            this.listeners[eventName] = callback;
        },
        fire(eventName, options = {}) {
            const event = {
                buttons: options.buttons ?? 1,
                clientX: options.clientX ?? 50,
                clientY: options.clientY ?? 50,
                defaultPrevented: false,
                pointerId: options.pointerId || 7,
                preventDefault() {
                    this.defaultPrevented = true;
                }
            };

            this.listeners[eventName](event);

            return event;
        },
        getBoundingClientRect() {
            return this.rect;
        },
        setPointerCapture(pointerId) {
            this.pointerCapture = pointerId;
        }
    };
}

function createTouchDocument() {
    const ids = [
        'touchControls',
        'touchJoystick',
        'touchJoystickKnob',
        'touchAimSlider',
        'touchAimHandle',
        'touchShootButton'
    ];
    const elements = Object.fromEntries(
        ids.map(function (id) {
            return [id, createTouchElement(id)];
        })
    );

    return {
        elements,
        getElementById(id) {
            return elements[id] || null;
        }
    };
}

function createAudioConstructor(calls) {
    return class FakeAudio {
        constructor(src) {
            this.currentTime = 0;
            this.muted = false;
            this.preload = '';
            this.src = src;
            this.volume = 0;
            calls.push(['create', src]);
        }

        cloneNode() {
            return new FakeAudio(this.src + ':clone');
        }

        load() {
            calls.push(['load', this.src]);
        }

        pause() {
            calls.push(['pause', this.src]);
        }

        play() {
            calls.push(['play', this.src, this.volume, this.muted]);
        }
    };
}

test('camera follows targets within visible world bounds', async function () {
    const { Camera } = await loadBrowserConstructors();
    const camera = new Camera({
        scale: 2,
        screenHeight: 100,
        screenWidth: 100,
        smoothing: 0.5,
        worldHeight: 200,
        worldWidth: 300
    });

    camera.follow({
        x: 200,
        y: 150
    });

    assert.deepEqual(
        {
            initialized: camera.initialized,
            x: camera.x,
            y: camera.y
        },
        {
            initialized: true,
            x: 175,
            y: 125
        }
    );

    camera.follow({
        x: 100,
        y: 100
    });

    assert.deepEqual(
        {
            x: camera.x,
            y: camera.y
        },
        {
            x: 125,
            y: 100
        }
    );
});

test('touch controls bind buttons, joystick, aim, and visibility state', async function () {
    const { TouchControls } = await loadBrowserConstructors();
    const document = createTouchDocument();
    const calls = [];
    let aimLevel = 4;
    const controls = TouchControls({
        document,
        getAimLevel() {
            return aimLevel;
        },
        input: {
            press(key) {
                calls.push(['press', key]);
                if (key === 'a') {
                    aimLevel += 1;
                }
                if (key === 'z') {
                    aimLevel -= 1;
                }
            },
            ready() {
                calls.push(['ready']);
            },
            release(key) {
                calls.push(['release', key]);
            },
            releaseReady() {
                calls.push(['releaseReady']);
            }
        },
        window: {
            location: {
                search: '?touch=1'
            }
        }
    });

    assert.ok(document.elements.touchJoystick.listeners.pointerdown);
    assert.ok(document.elements.touchAimSlider.listeners.pointerdown);
    assert.ok(document.elements.touchShootButton.listeners.pointerdown);

    document.elements.touchShootButton.fire('pointerdown');
    document.elements.touchShootButton.fire('pointerup');
    document.elements.touchJoystick.fire('pointerdown', {
        clientX: 100,
        clientY: 50
    });
    document.elements.touchJoystick.fire('pointerup');
    document.elements.touchAimSlider.fire('pointerdown', {
        clientY: 0
    });

    let renderProps = controls.update({
        aimLevel: 6,
        playing: true,
        waiting: false
    });

    assert.equal(renderProps.debug, true);
    assert.equal(renderProps.enabled, true);
    assert.equal(renderProps.gameplay.visible, true);
    assert.equal(document.elements.touchAimHandle.style.top, '25%');
    assert.equal(renderProps.lobby.visible, false);

    renderProps = controls.update({
        waiting: true
    });

    assert.equal(renderProps.gameplay.visible, false);

    assert.equal(renderProps.lobby.visible, true);
    assert.equal(renderProps.lobby.showMainButtons, true);
    assert.equal(renderProps.lobby.showBackButton, false);
    renderProps.lobby.onPlay();
    renderProps.lobby.onEdit();
    renderProps.lobby.onHighScores();

    renderProps = controls.update({
        highScoresVisible: true,
        waiting: true
    });

    assert.equal(renderProps.lobby.visible, true);
    assert.equal(renderProps.lobby.showMainButtons, false);
    assert.equal(renderProps.lobby.showBackButton, true);
    renderProps.lobby.onBack();

    assert.deepEqual(calls, [
        ['press', ' '],
        ['release', ' '],
        ['press', 'l'],
        ['release', 'l'],
        ['press', 'a'],
        ['release', 'a'],
        ['press', 'a'],
        ['release', 'a'],
        ['press', 'a'],
        ['release', 'a'],
        ['press', 'a'],
        ['release', 'a'],
        ['release', ' '],
        ['ready'],
        ['releaseReady'],
        ['press', 'e'],
        ['release', 'e'],
        ['press', 's'],
        ['release', 's'],
        ['release', ' '],
        ['press', 's'],
        ['release', 's']
    ]);
});

test('sound effects play fallback audio and map obstacle ids', async function () {
    const { SoundEffects } = await loadBrowserConstructors();
    const calls = [];
    const listeners = [];
    const soundEffects = new SoundEffects({
        Audio: createAudioConstructor(calls),
        document: {
            addEventListener(eventName, callback) {
                listeners.push([eventName, callback]);
            }
        },
        window: {}
    });

    soundEffects.play('gunshot');
    soundEffects.playObstacleHit('wagon');
    soundEffects.playObstacleHit('cactus:1');
    soundEffects.playObstacleHit('rock');

    assert.equal(listeners.length, 2);
    assert.deepEqual(
        calls.filter(function (call) {
            return call[0] === 'play';
        }),
        [
            ['play', 'sounds/gunshot.m4a', 0.8, false],
            ['play', 'sounds/wagon-hit.mp3', 0.8, false],
            ['play', 'sounds/cactus-hit.m4a', 0.8, false]
        ]
    );
});
