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
    ignorePatterns: ['node_modules/', 'package-lock.json'],
    rules: {
        eqeqeq: ['error', 'always'],
        'no-undef': 'error',
        'no-unused-vars': 'off'
    },
    overrides: [
        {
            files: ['client/js/**/*.js'],
            parserOptions: {
                sourceType: 'script'
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
