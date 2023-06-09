const envPreset = ['@babel/preset-env', {
    targets: {
        node: '10.0',
        browsers: 'last 8 versions, not dead and not op_mini all and not ie <= 11',
    },
}]
const plugins = [
    '@babel/plugin-transform-destructuring',
    '@babel/plugin-transform-object-rest-spread',
    'add-module-exports',
]

module.exports = {
    env: {
        development: {
            presets: [
                envPreset,
            ],
            plugins,
        },
        production: {
            presets: [
                envPreset,
                'minify',
            ],
            plugins,
        }
    }
}
