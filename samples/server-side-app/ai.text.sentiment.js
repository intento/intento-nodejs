const client = require('./index')

// eslint-disable-next-line require-jsdoc
function prettyPrint(data) {
    console.log(JSON.stringify(data, null, 4))
}

// eslint-disable-next-line require-jsdoc
async function tests() {
    const test1 = await client.ai.text.sentiment
        .fulfill({
            text: 'We love this place',
            lang: 'en',
            provider: 'ai.text.sentiment.meaningcloud.sentiment_analysis_api.2-1',
        })
    prettyPrint(test1)

    const data = await client.ai.text.sentiment
        .providers({ bulk: true })

    data.forEach(p => console.info(p.name))

    // Bulk mode
    const bulk = await client.ai.text.sentiment
        .fulfill({
            text: ['We love this shop!', 'The quality is not as good as it should'],
            lang: 'en',
            provider: 'ai.text.sentiment.ibm.natural_language_understanding',
        })
    prettyPrint(bulk)
}

tests().catch(console.error)
// more examples on exploring providers in ./explore-providers.js
