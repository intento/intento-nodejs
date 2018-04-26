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

// Supported languages
   
// List of supported languages
client.ai.text.translate
    .languages({ locale: 'ru' })
    .then(console.log)
    .catch(console.error)

// Full information on a supported language
client.ai.text.translate
    .languages({ language: 'he', locale: 'ru' })
    .then(console.log)
    .catch(console.error)

// Setting your own language codes
client.ai.settings
    .languages({ aliasforen: 'en' })
    .then(console.log)
    .catch(console.error)

// // All language settings
client.ai.settings
    .languages()
    .then(console.log)
    .catch(console.error)

