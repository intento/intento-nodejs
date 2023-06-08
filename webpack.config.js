const path = require('path')

const resolve = {
    fallback: {
        buffer: require.resolve('buffer/'),
        http: require.resolve('stream-http'),
        https: require.resolve('https-browserify'),
        url: require.resolve('url/'),
    },
}

const serverDevConfig = {
    entry: './src/build.js',
    target: 'node',
    mode: 'development',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'intentoConnector.node.js',
        hashFunction: 'xxhash64',
    },
    resolve,
}

const serverConfig = {
    entry: './src/build.js',
    target: 'node',
    mode: 'production',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'intentoConnector.node.min.js',
        hashFunction: 'xxhash64',
    },
    resolve,
}

const clientDevConfig = {
    entry: './src/build.js',
    target: 'web', // <=== can be omitted as default is 'web'
    mode: 'development',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'intentoConnector.js',
        hashFunction: 'xxhash64',
    },
    resolve,
}

const clientConfig = {
    entry: './src/build.js',
    target: 'web', // <=== can be omitted as default is 'web'
    mode: 'production',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'intentoConnector.min.js',
        hashFunction: 'xxhash64',
    },
    resolve,
}

module.exports = [serverDevConfig, serverConfig, clientDevConfig, clientConfig]
