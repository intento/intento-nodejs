if (process) {
    const currentNodeJSVersion = Number(process.version.match(/^v?(\d+\.\d+)/)[1])
    const minimalNodeJSVersion = '10.0'
    if (currentNodeJSVersion < Number(minimalNodeJSVersion)) {
        console.error(
            `\nMinimal node version required for this script is ${minimalNodeJSVersion}.0.`
        )
        console.error(`Your node version is ${currentNodeJSVersion}.`)
        console.log('Please, upgrade your node\n')
        process.exit(1)
    }
}

const client = require('./index')

client.ai.text.translate
    .providers()
    .then(printProviderNames)
    .catch(console.error)

client.ai.text.sentiment
    .providers()
    .then(console.log)
    .catch(console.error)

client.ai.text.dictionary
    .providers()
    .then(printProvidersInfo)
    .catch(console.error)

client.ai.text.translate
    .providers({ format: 'xml' })
    .then(data => {
        console.log('Translation providers supporting xml input')
        printProviderNames(data)
        console.log('')
    })
    .catch(console.error)

client.ai.text.translate
    .providers({ to: 'af' })
    .then(printProvidersAsTable)
    .catch(console.error)

client.ai.text.translate
    .providers({ to: 'it', bulk: true, lang_detect: true })
    .then(data => data.forEach(p => console.info(p.name)))
    .catch(console.error)

// Getting information about a provider
client.ai.text.translate
    .provider('ai.text.translate.google.translate_api.2-0')
    .then(console.log)
    .catch(console.error)

// helpers

/**
 * Print provider names only
 *
 * @param {array} data list of provider descriptions
 * @returns {undefined}
 */
function printProviderNames(data) {
    console.log(`There are overall ${data.length} providers:`)
    data.forEach((p, i) => console.log(`  ${i + 1}. ${p.name}`))
}

/**
 * Print provider full, but "zip" info about language pairs
 *
 * @param {array} data list of provider descriptions
 * @returns {undefined}
 */
function printProvidersInfo(data) {
    console.log(`There are overall ${data.length} providers:`)
    console.info(
        data.map(provider => ({
            ...provider,
            symmetric: provider.symmetric.length,
            pairs: provider.pairs.length,
        }))
    )
}

/**
 * Print provider as table view
 * console.table requires node@^v10.0.0
 * @param {array} data list of provider descriptions
 * @returns {undefined}
 */
function printProvidersAsTable(data) {
    console.log(`\nThere are overall ${data.length} providers:`)

    console.table(
        data.map(({ id, name, symmetric, pairs }) => ({
            name,
            symmetric: symmetric.length,
            pairs: pairs.length,
            id,
        })),
        ['name', 'symmetric', 'pairs', 'id']
    )
    console.log('\n\n')
}
