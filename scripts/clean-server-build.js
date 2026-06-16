import { rmSync } from 'node:fs';

rmSync('dist/server', { force: true, recursive: true });
