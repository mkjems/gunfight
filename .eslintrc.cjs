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
    globals: {
        GF: 'readonly',
        io: 'readonly',
        requestAnimFrame: 'readonly'
    },
    ignorePatterns: [
        'gameserver/node_modules/',
        'gameserver/package-lock.json'
    ],
    rules: {
        eqeqeq: ['error', 'always'],
        'no-undef': 'error',
        'no-unused-vars': 'off'
    },
    overrides: [
        {
            files: ['www/js/**/*.js'],
            parserOptions: {
                sourceType: 'script'
            }
        },
        {
            files: ['gameserver/test/**/*.js'],
            env: {
                node: true
            }
        }
    ]
};
