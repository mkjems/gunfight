import { cpSync, mkdirSync, rmSync } from 'node:fs';

function copyDirectory(source, destination) {
    rmSync(destination, { force: true, recursive: true });
    cpSync(source, destination, {
        filter: function (sourcePath) {
            return !sourcePath.endsWith('.DS_Store');
        },
        recursive: true
    });
}

function copyFile(source, destination) {
    cpSync(source, destination);
}

mkdirSync('dist/server', { recursive: true });
copyDirectory('client', 'dist/client');
copyFile('server/rocks.json', 'dist/server/rocks.json');
copyFile('server/scenarios.json', 'dist/server/scenarios.json');
