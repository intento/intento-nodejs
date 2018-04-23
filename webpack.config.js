const path = require('path')

module.exports = {
    entry: './src/index.js',
    output: {
        libraryExport: 'default',
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
}
