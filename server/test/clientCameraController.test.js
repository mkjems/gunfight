import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
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
            module: ts.ModuleKind.ES2022,
            target: ts.ScriptTarget.ES2022
        }
    });

    writeFileSync(
        path.join(tempDirectory, outputName),
        transpiled.outputText,
        'utf8'
    );
}

async function loadClientCameraController() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    compileClientModule('clientScreens.ts', 'clientScreens.js', tempDirectory);
    compileClientModule(
        'clientCameraController.ts',
        'clientCameraController.js',
        tempDirectory
    );

    const module = await import(
        pathToFileURL(path.join(tempDirectory, 'clientCameraController.js'))
            .href
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
                matches: !!options.coarse
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
                roundState: 'playing',
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
                roundState: 'waiting',
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
