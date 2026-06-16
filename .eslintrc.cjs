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
            files: ['server/test/**/*.js'],
            env: {
                node: true
            }
        }
    ]
};
