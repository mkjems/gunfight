import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
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
            module: ts.ModuleKind.ES2022,
            target: ts.ScriptTarget.ES2022
        }
    });

    const outputPath = path.join(tempDirectory, outputName);

    mkdirSync(path.dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, transpiled.outputText, 'utf8');
}

async function loadClientCameraController() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    compileClientModule(
        'state/clientScreens.ts',
        'state/clientScreens.js',
        tempDirectory
    );
    compileClientModule(
        'engine/clientCameraController.ts',
        'engine/clientCameraController.js',
        tempDirectory
    );

    const module = await import(
        pathToFileURL(
            path.join(tempDirectory, 'engine/clientCameraController.js')
        ).href
    );

    return module.ClientCameraController;
}

function createWindow(options = {}) {
    return {
        innerHeight: options.innerHeight || 640,
        innerWidth: options.innerWidth || 950,
        location: {
            search: options.search || ''
        },
        matchMedia() {
            return {
                matches: Boolean(options.coarse)
            };
        }
    };
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test('chooses camera scale from query string and touch media', async function () {
    const ClientCameraController = await loadClientCameraController();

    assert.equal(
        new ClientCameraController({
            window: createWindow({ search: '?cameraScale=2.25' })
        }).getCameraScale(),
        2.25
    );
    assert.equal(
        new ClientCameraController({
            window: createWindow({ search: '?camera=1' })
        }).getCameraScale(),
        1.85
    );
    assert.equal(
        new ClientCameraController({
            window: createWindow({ coarse: true })
        }).getCameraScale(),
        1.15
    );
});

test('calculates visible canvas screen from browser viewport', async function () {
    const ClientCameraController = await loadClientCameraController();
    const controller = new ClientCameraController({
        window: createWindow({
            innerHeight: 500,
            innerWidth: 800
        })
    });
    const canvas = {
        height: 640,
        width: 950,
        getBoundingClientRect() {
            return {
                bottom: 620,
                height: 640,
                left: -50,
                right: 900,
                top: -20,
                width: 950
            };
        }
    };

    assert.deepEqual(plain(controller.getVisibleCanvasScreen(canvas)), {
        x: 50,
        y: 20,
        width: 800,
        height: 500
    });
});

test('updates camera viewport and resets when camera is disabled', async function () {
    const ClientCameraController = await loadClientCameraController();
    const calls = [];
    const controller = new ClientCameraController({
        window: createWindow({
            innerHeight: 480,
            innerWidth: 700
        })
    });
    const camera = {
        follow(player) {
            calls.push(['camera.follow', player.id]);
        },
        reset() {
            calls.push('camera.reset');
        },
        setScale(scale) {
            calls.push(['camera.setScale', scale]);
        },
        setScreenSize(width, height) {
            calls.push(['camera.setScreenSize', width, height]);
        },
        setVisibleScreen(x, y, width, height) {
            calls.push(['camera.setVisibleScreen', x, y, width, height]);
        }
    };
    const canvas = {
        height: 640,
        width: 950,
        getBoundingClientRect() {
            return {
                bottom: 640,
                height: 640,
                left: 0,
                right: 950,
                top: 0,
                width: 950
            };
        }
    };

    controller.update({
        camera,
        canvas,
        player: {
            id: 'p1'
        },
        duelState: 'waiting'
    });

    assert.deepEqual(plain(calls), [
        ['camera.setScreenSize', 950, 640],
        ['camera.setVisibleScreen', 0, 0, 700, 480],
        ['camera.setScale', 1],
        'camera.reset'
    ]);
});

test('projects world points through the active camera', async function () {
    const ClientCameraController = await loadClientCameraController();
    const controller = new ClientCameraController({
        window: createWindow({ search: '?camera=1' })
    });

    assert.deepEqual(
        plain(
            controller.worldToHudPoint({
                camera: {
                    scale: 2,
                    x: 10,
                    y: 20
                },
                duelState: 'playing',
                x: 30,
                y: 50
            })
        ),
        {
            x: 40,
            y: 60
        }
    );
    assert.deepEqual(
        plain(
            controller.worldToHudPoint({
                camera: {
                    scale: 2,
                    x: 10,
                    y: 20
                },
                duelState: 'waiting',
                x: 30,
                y: 50
            })
        ),
        {
            x: 30,
            y: 50
        }
    );
});
