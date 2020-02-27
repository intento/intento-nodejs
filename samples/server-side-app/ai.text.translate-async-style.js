const client = require('./index')

// eslint-disable-next-line require-jsdoc
function prettyPrint(data) {
    console.log(JSON.stringify(data, null, 4))
}
// eslint-disable-next-line require-jsdoc
async function tests() {
    // Language detection mode (no `from` parameter)
    const test1 = await client.ai.text.translate
        .fulfill({ text: "How's it going?", to: 'es' })
    prettyPrint(test1)

    // Bulk mode
    const bulk = await client.ai.text.translate
        .fulfill({
            text: ['A sample text', 'Hello world'],
            from: 'en',
            to: 'es',
        })
    prettyPrint(bulk)

    // category `generalnn`
    const test3 = await client.ai.text.translate
        .fulfill({
            text: 'A sample text',
            to: 'es',
            category: 'generalnn', // <-- specify a domain
            provider: 'ai.text.translate.microsoft.translator_text_api.2-0',
        })
    prettyPrint(test3)

    // Specified input format
    const test4 = await client.ai.text.translate
        .fulfill({
            text: '<p>A <div>sample</div> text</p>',
            to: 'ru',
            format: 'html', // <-- specify input format
            provider: 'ai.text.translate.google.translate_api.2-0',
        })
    prettyPrint(test4)
}

tests().catch(console.error)
