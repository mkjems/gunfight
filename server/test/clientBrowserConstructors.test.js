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
        path.join(process.cwd(), 'client/src/modules', sourceName),
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

    writeFileSync(
        path.join(tempDirectory, outputName),
        transpiled.outputText,
        'utf8'
    );
}

async function loadBrowserConstructors() {
    const cacheDirectory = path.join(process.cwd(), 'node_modules', '.cache');
    mkdirSync(cacheDirectory, { recursive: true });

    const tempDirectory = mkdtempSync(
        path.join(cacheDirectory, 'gunfight-browser-constructors-')
    );

    compileClientModule('config.ts', 'config.js', tempDirectory);
    compileClientModule('camera.ts', 'camera.js', tempDirectory);
    compileClientModule('soundEffects.ts', 'soundEffects.js', tempDirectory);
    compileClientModule('touchControls.ts', 'touchControls.js', tempDirectory);
    compileClientModule(
        'touchLobbyControlsComponentScreen.tsx',
        'touchLobbyControlsComponentScreen.js',
        tempDirectory
    );

    try {
        const [cameraModule, soundModule, touchModule] = await Promise.all(
            ['camera.js', 'soundEffects.js', 'touchControls.js'].map(
                function (fileName) {
                    return import(
                        pathToFileURL(path.join(tempDirectory, fileName)).href
                    );
                }
            )
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
        'touchActionControls',
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
    const lobbyRenders = [];
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
            }
        },
        lobbyControlsScreen: {
            render(props) {
                lobbyRenders.push(props);
            }
        },
        window: {
            location: {
                search: '?touch=1'
            }
        }
    });

    assert.equal(document.elements.touchControls.hidden, false);
    assert.equal(
        document.elements.touchControls.classList.classes['debug-touch'],
        true
    );

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

    controls.update({
        aimLevel: 6,
        playing: true,
        waiting: false
    });

    assert.equal(document.elements.touchActionControls.hidden, false);
    assert.equal(document.elements.touchJoystick.hidden, false);
    assert.equal(document.elements.touchAimHandle.style.top, '25%');
    assert.equal(lobbyRenders.at(-1).visible, false);

    controls.update({
        waiting: true
    });

    const lobbyProps = lobbyRenders.at(-1);
    assert.equal(lobbyProps.visible, true);
    assert.equal(lobbyProps.showButtons, true);
    lobbyProps.onPlay();
    lobbyProps.onEdit();

    controls.update({
        highScoresVisible: true,
        waiting: true
    });

    assert.equal(lobbyRenders.at(-1).visible, true);
    assert.equal(lobbyRenders.at(-1).showButtons, false);

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
        ['press', 'e'],
        ['release', 'e'],
        ['release', ' ']
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
