const client = require('./index')

// // Language detection mode (no `from` parameter)
// client.ai.text.dictionary
//     .fulfill({
//         text: 'kick',
//         from: 'en',
//         to: 'es',
//         provider: 'ai.text.dictionary.yandex.dictionary_api.1-0',
//     })
//     .then(res => console.log(res.results))
//     .catch(console.error)

// // Bulk mode
// client.ai.text.dictionary
//     .fulfill({
//         text: ['A sample text', 'Hello world'],
//         from: 'en',
//         to: 'es',
//     })
//     .then(console.log)
//     .catch(console.error)

// // more examples on exploring providers in ./explore-providers.js

// // Supported languages

// // List of supported languages
// client.ai.text.dictionary
//     .languages({ locale: 'ru' })
//     .then(console.log)
//     .catch(console.error)

// // Full information on a supported language
// client.ai.text.dictionary
//     .languages({ language: 'he', locale: 'ru' })
//     .then(console.log)
//     .catch(console.error)

// Setting your own language codes (to be bind to the current Intento api key)
client.ai.settings
    .languages({ hebr: 'he' })
    .then(res => {
        console.log('set alias', res)
    })
    .catch(console.error)

setTimeout(() => {
    // All language settings related to the current Intento api key
    client.ai.settings.languages().then(res => {
        console.log('all aliases', res)
    })
}, 3000)
