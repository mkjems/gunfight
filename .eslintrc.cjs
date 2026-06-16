const CLIENT_SIDE_EFFECT_IMPORT_PATTERNS = [
    {
        group: ['**/engine/**'],
        message:
            'State and view-model modules must receive engine data as plain inputs.'
    },
    {
        group: ['**/flows/**'],
        message:
            'State and view-model modules must not depend on orchestration flows.'
    },
    {
        group: ['**/input/**'],
        message:
            'State and view-model modules must receive input state as plain data.'
    },
    {
        group: ['**/network/**'],
        message:
            'State and view-model modules must not depend on socket/network code.'
    },
    {
        group: ['**/platform/**'],
        message:
            'State and view-model modules must receive browser/platform data as inputs.'
    },
    {
        group: ['**/runtime/**'],
        message:
            'State and view-model modules must not depend on runtime wiring.'
    }
];

const VIEW_MODEL_IMPORT_PATTERNS = [
    ...CLIENT_SIDE_EFFECT_IMPORT_PATTERNS,
    {
        group: ['preact', 'preact/**', '@preact/**'],
        message:
            'View models must stay framework-independent and return plain data.'
    },
    {
        group: ['socket.io', 'socket.io-client', 'socket.io/**'],
        message: 'View models must not depend on socket code.'
    }
];

const STATE_IMPORT_PATTERNS = [
    ...CLIENT_SIDE_EFFECT_IMPORT_PATTERNS,
    {
        group: ['**/ui/**'],
        message: 'State modules must not depend on UI modules.'
    },
    {
        group: ['preact', 'preact/**', '@preact/**'],
        message: 'State modules must stay framework-independent.'
    },
    {
        group: ['socket.io', 'socket.io-client', 'socket.io/**'],
        message: 'State modules must not depend on socket code.'
    }
];

const CLIENT_DOM_AND_SOCKET_GLOBALS = [
    {
        name: 'window',
        message: 'Pass browser data in from a platform or flow module.'
    },
    {
        name: 'document',
        message: 'DOM access belongs in UI, platform, input, or flow modules.'
    },
    {
        name: 'localStorage',
        message: 'Storage access belongs in platform or flow modules.'
    },
    {
        name: 'sessionStorage',
        message: 'Storage access belongs in platform or flow modules.'
    },
    {
        name: 'navigator',
        message: 'Pass browser capability data in from a platform module.'
    },
    {
        name: 'fetch',
        message: 'Network access belongs outside state and view-model modules.'
    },
    {
        name: 'WebSocket',
        message: 'Socket access belongs outside state and view-model modules.'
    },
    {
        name: 'EventSource',
        message: 'Network access belongs outside state and view-model modules.'
    },
    {
        name: 'HTMLCanvasElement',
        message: 'Canvas access belongs in engine, platform, or UI modules.'
    },
    {
        name: 'CanvasRenderingContext2D',
        message: 'Canvas access belongs in engine, platform, or UI modules.'
    },
    {
        name: 'io',
        message: 'Socket access belongs outside state and view-model modules.'
    }
];

const CLIENT_TIMER_GLOBALS = [
    {
        name: 'setTimeout',
        message: 'Timer scheduling belongs in flow modules or clientTimers.'
    },
    {
        name: 'clearTimeout',
        message: 'Timer scheduling belongs in flow modules or clientTimers.'
    },
    {
        name: 'setInterval',
        message: 'Timer scheduling belongs in flow modules or clientTimers.'
    },
    {
        name: 'clearInterval',
        message: 'Timer scheduling belongs in flow modules or clientTimers.'
    },
    {
        name: 'requestAnimationFrame',
        message: 'Animation scheduling belongs in runtime or flow modules.'
    },
    {
        name: 'cancelAnimationFrame',
        message: 'Animation scheduling belongs in runtime or flow modules.'
    }
];

module.exports = {
    root: true,
    env: {
        browser: true,
        es2022: true,
        node: true
    },
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
    },
    extends: ['eslint:recommended'],
    globals: {
        GF: 'readonly',
        io: 'readonly',
        requestAnimFrame: 'readonly'
    },
    ignorePatterns: ['node_modules/', 'package-lock.json'],
    plugins: ['@typescript-eslint'],
    rules: {
        curly: ['error', 'all'],
        eqeqeq: ['error', 'always'],
        'no-implicit-coercion': 'error',
        'no-undef': 'error',
        'no-var': 'error',
        'no-unused-vars': 'off',
        'prefer-const': 'error'
    },
    overrides: [
        {
            files: ['**/*.ts', '**/*.tsx'],
            extends: ['plugin:@typescript-eslint/recommended'],
            parser: '@typescript-eslint/parser',
            parserOptions: {
                ecmaVersion: 2022,
                sourceType: 'module'
            },
            rules: {
                'no-implicit-coercion': 'off',
                'no-undef': 'off'
            }
        },
        {
            files: ['client/src/ui/viewModels/**/*.ts'],
            rules: {
                'no-restricted-globals': [
                    'error',
                    ...CLIENT_DOM_AND_SOCKET_GLOBALS,
                    ...CLIENT_TIMER_GLOBALS
                ],
                'no-restricted-imports': [
                    'error',
                    {
                        patterns: VIEW_MODEL_IMPORT_PATTERNS
                    }
                ]
            }
        },
        {
            files: ['client/src/state/**/*.ts'],
            rules: {
                'no-restricted-globals': [
                    'error',
                    ...CLIENT_DOM_AND_SOCKET_GLOBALS
                ],
                'no-restricted-imports': [
                    'error',
                    {
                        patterns: STATE_IMPORT_PATTERNS
                    }
                ]
            }
        },
        {
            files: ['client/src/state/**/*.ts'],
            excludedFiles: ['client/src/state/clientTimers.ts'],
            rules: {
                'no-restricted-globals': [
                    'error',
                    ...CLIENT_DOM_AND_SOCKET_GLOBALS,
                    ...CLIENT_TIMER_GLOBALS
                ]
            }
        },
        {
            files: ['server/test/**/*.js'],
            env: {
                node: true
            }
        }
    ]
};
