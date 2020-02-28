const client = require('./index')

// eslint-disable-next-line require-jsdoc
function prettyPrint(title, data) {
    console.log(title)

    console.log(JSON.stringify(data, null, 4))
}

// eslint-disable-next-line require-jsdoc
async function tests() {
    // Language detection mode
    const langDetect = await client.ai.text.translate.fulfill({ text: "How's it going?", to: 'es' })
    prettyPrint('Language detection mode:', langDetect)

    // Bulk mode
    const bulkMode = await client.ai.text.translate.fulfill({
        text: ['A sample text', 'Hello world'],
        from: 'en',
        to: 'es',
    })
    prettyPrint('Bulk mode:', bulkMode)

    // Format support
    const formatSupport = await client.ai.text.translate.fulfill({
        text: '<p>A <b>sample</b> text</p>',
        to: 'ru',
        format: 'html', // <-- specify input format
        provider: 'ai.text.translate.google.translate_api.2-0',
    })
    prettyPrint('Format support:', formatSupport)
}

tests().catch(console.error)
