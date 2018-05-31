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
    .then(printProviderNames)
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

function printProviderNames(data) {
    console.log(`There are overall ${data.length} providers:`)
    data.forEach((p, i) => console.log(`  ${i + 1}. ${p.name}`))
}

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

// console.table requires node v10.0.0
// One can use this function as a callback if one's nodejs version is >=10.0.0
// If your `node --version` is below 10 consider upgrading node
// This callback gives very nice and clear output.
// eslint-disable-next-line no-unused-vars
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
