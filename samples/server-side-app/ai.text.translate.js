const client = require('./index')

// Language detection mode (no `from` parameter)
client.ai.text.translate
    .fulfill({ text: "How's it going?", to: 'es' })
    .then(console.log)
    .catch(console.error)

// Bulk mode
client.ai.text.translate
    .fulfill({
        text: ['A sample text', 'Hello world'],
        from: 'en',
        to: 'es',
    })
    .then(console.log)
    .catch(console.error)

// Translation domains

// category `general`
client.ai.text.translate
    .fulfill({
        text: 'A sample text',
        to: 'es',
        category: 'general', // <-- specify a domain
        provider: 'ai.text.translate.microsoft.translator_text_api.2-0',
    })
    .then(console.log)
    .catch(console.error)

// category `generalnn`
client.ai.text.translate
    .fulfill({
        text: 'A sample text',
        to: 'es',
        category: 'generalnn', // <-- specify a domain
        provider: 'ai.text.translate.microsoft.translator_text_api.2-0',
    })
    .then(console.log)
    .catch(console.error)

// Specified input format
client.ai.text.translate
    .fulfill({
        text: '<p>A <div>sample</div> text</p>',
        to: 'ru',
        format: 'html', // <-- specify input format
        provider: 'ai.text.translate.google.translate_api.2-0',
    })
    .then(console.log)

// more examples on exploring providers in ./explore-providers.js

// Supported languages

// List of supported languages
client.ai.text.translate
    .languages({ locale: 'ru' })
    .then(console.log)
    .catch(console.error)

// Full information on a supported language
client.ai.text.translate
    .language('he', { locale: 'ru' })
    .then(console.log)
    .catch(console.error)

// Setting your own language codes (to be bind to the current Intento api key)
client.settings
    .languages({ 'alias-for-es': 'es' })
    .then(res => {
        console.log('set alias', res)
    })
    .catch(console.error)

setTimeout(() => {
    // All language settings related to the current Intento api key
    client.settings.languages().then(res => {
        console.log('all aliases', res)
    })
}, 3000)
