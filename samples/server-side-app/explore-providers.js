const utils = require('./utils')
const {
    printProviderNames,
    printProvidersInfo,
    printProviderBriefInfo,
    printProvidersAsTable,
} = utils

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

// https://github.com/intento/intento-api/blob/master/ai.text.translate.md#using-previously-trained-custom-models
client.ai.text.translate
    .providers({ custom_model: true })
    .then(printProviderBriefInfo)
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
