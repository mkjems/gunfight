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
mkdirSync('dist/client', { recursive: true });
copyDirectory('client/css', 'dist/client/css');
copyDirectory('client/fonts', 'dist/client/fonts');
copyDirectory('client/images', 'dist/client/images');
copyDirectory('client/sounds', 'dist/client/sounds');
copyFile('client/favicon.ico', 'dist/client/favicon.ico');
copyFile('client/manifest.webmanifest', 'dist/client/manifest.webmanifest');
copyFile('client/sw.js', 'dist/client/sw.js');
copyFile('server/rocks.json', 'dist/server/rocks.json');
copyFile('server/scenarios.json', 'dist/server/scenarios.json');
