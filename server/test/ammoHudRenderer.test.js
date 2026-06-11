import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

function loadAmmoHudRenderer() {
    const context = {
        GF: {
            Config: {
                colors: {
                    yellow: 'yellow'
                },
                graphics: {
                    scale: 2
                }
            }
        }
    };
    const source = readFileSync(
        new URL('../../client/js/AmmoHudRenderer.js', import.meta.url),
        'utf8'
    );

    vm.runInNewContext(source, context);

    return context.GF.AmmoHudRenderer;
}

function createContext() {
    const calls = [];

    return {
        calls,
        save() {
            calls.push(['save']);
        },
        restore() {
            calls.push(['restore']);
        },
        drawImage(sprite, x, y, width, height) {
            calls.push(['drawImage', sprite.id, x, y, width, height]);
        },
        fillRect(x, y, width, height) {
            calls.push(['fillRect', x, y, width, height]);
        }
    };
}

test('draws ammo with the sprite when it is loaded', function () {
    const AmmoHudRenderer = loadAmmoHudRenderer();
    const context = createContext();
    const renderer = new AmmoHudRenderer({
        context,
        sprite: {
            complete: true,
            id: 'bullet'
        }
    });

    renderer.render(2, 100, 200, 1);

    assert.deepEqual(context.calls, [
        ['save'],
        ['drawImage', 'bullet', 100, 200, 14, 32],
        ['drawImage', 'bullet', 120, 200, 14, 32],
        ['restore']
    ]);
});

test('draws fallback rectangles when the sprite is not loaded', function () {
    const AmmoHudRenderer = loadAmmoHudRenderer();
    const context = createContext();
    const renderer = new AmmoHudRenderer({
        context,
        sprite: {
            complete: false
        }
    });

    renderer.render(2, 100, 200, -1);

    assert.deepEqual(context.calls, [
        ['save'],
        ['fillRect', 100, 200, 14, 32],
        ['fillRect', 80, 200, 14, 32],
        ['restore']
    ]);
});
