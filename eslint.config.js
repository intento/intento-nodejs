const js = require('@eslint/js')
const globals = require('globals')
const babelParser = require('@babel/eslint-parser')

module.exports = [
    js.configs.recommended,
    {
        languageOptions: {
            sourceType: 'commonjs',
            parser: babelParser,
            globals: { ...globals.node, ...globals.jest },
        },
        rules: {
            'no-console': 'off',
            indent: ['error', 4],
            semi: ['error', 'never'],
            'object-curly-spacing': ['error', 'always'],
        },
    },
]
