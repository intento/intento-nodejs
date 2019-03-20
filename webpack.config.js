const path = require('path')

const serverDevConfig = {
    entry: './src/build.js',
    target: 'node',
    mode: 'development',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'intentoConnector.node.js'
    }
}

const serverConfig = {
    entry: './src/build.js',
    target: 'node',
    mode: 'production',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'intentoConnector.node.min.js'
    }
}

const clientDevConfig = {
    entry: './src/build.js',
    target: 'web', // <=== can be omitted as default is 'web'
    mode: 'development',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'intentoConnector.js'
    }
}

const clientConfig = {
    entry: './src/build.js',
    target: 'web', // <=== can be omitted as default is 'web'
    mode: 'production',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'intentoConnector.min.js'
    }
}

module.exports = [serverDevConfig, serverConfig, clientDevConfig, clientConfig]