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

async function loadClientHitDetection() {
    const tempDirectory = mkdtempSync(path.join(tmpdir(), 'gunfight-client-'));

    compileClientModule(
        'state/clientScreens.ts',
        'state/clientScreens.js',
        tempDirectory
    );
    compileClientModule(
        'flows/clientHitDetection.ts',
        'flows/clientHitDetection.js',
        tempDirectory
    );

    const module = await import(
        pathToFileURL(path.join(tempDirectory, 'flows/clientHitDetection.js'))
            .href
    );

    return module.ClientHitDetection;
}

function plain(value) {
    return JSON.parse(JSON.stringify(value));
}

test('reports match expiry during hit pause', async function () {
    const hitDetection = await loadClientHitDetection();

    assert.deepEqual(
        plain(
            hitDetection.check({
                matchTimeExpired: true,
                roundState: 'hitPause'
            })
        ),
        {
            type: 'matchExpired'
        }
    );
});

test('marks obstacle bullets for deletion before returning obstacle hits', async function () {
    const hitDetection = await loadClientHitDetection();
    const bullet = {
        deleteMe: false
    };
    const hit = {
        bullet,
        obstacleId: 'wagon'
    };
    const result = hitDetection.check({
        bullets: { all: () => ({}) },
        findBulletObstacleHit() {
            return hit;
        },
        matchTimeExpired: false,
        players: { all: {} },
        roundState: 'playing'
    });

    assert.equal(result.type, 'obstacleHit');
    assert.equal(result.hit, hit);
    assert.equal(bullet.deleteMe, true);
});

test('marks player hit bullets for deletion before returning player hits', async function () {
    const bullet = {
        deleteMe: false
    };
    const hit = {
        bullet,
        targetId: 'p2',
        winnerId: 'p1'
    };
    const hitDetection = await loadClientHitDetection();
    const result = hitDetection.check({
        bullets: { all: () => ({ b1: bullet }) },
        collision: {
            findBulletHit() {
                return hit;
            }
        },
        findBulletObstacleHit() {
            return null;
        },
        matchTimeExpired: false,
        players: { all: {} },
        roundState: 'playing'
    });

    assert.equal(result.type, 'playerHit');
    assert.equal(result.hit, hit);
    assert.equal(bullet.deleteMe, true);
});

test('reports match expiry after hit checks during active play', async function () {
    const hitDetection = await loadClientHitDetection();

    assert.deepEqual(
        plain(
            hitDetection.check({
                bullets: { all: () => ({}) },
                findBulletObstacleHit() {
                    return null;
                },
                matchTimeExpired: true,
                players: { all: {} },
                roundState: 'playing'
            })
        ),
        {
            type: 'matchExpired'
        }
    );
});
