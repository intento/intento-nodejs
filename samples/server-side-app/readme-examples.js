const client = require('./index')

// eslint-disable-next-line require-jsdoc
function prettyPrint(title, data) {
    console.log(title)

    console.log(JSON.stringify(data, null, 4))
}

// eslint-disable-next-line require-jsdoc
async function tests() {
    // basic translation
    const basicTranslation = await client.ai.text.translate
        .fulfill({ text: "How's it going?", to: 'es' })
    prettyPrint('Basic translation results:', basicTranslation)

    // Sentiment analysis
    const sentimentAnalysis = await client.ai.text.sentiment
        .fulfill({
            text: 'We love this place',
            lang: 'en',
            provider: 'ai.text.sentiment.ibm.natural_language_understanding',
        })
    prettyPrint('Sentiment analysis results:', sentimentAnalysis)

    // Text meanings
    const textMeanings = await client.ai.text.dictionary
        .fulfill({
            text: 'meaning',
            from: 'en',
            to: 'ru',
        })
    prettyPrint('Dictionary results:', textMeanings)

    // Translation providers
    const translationProviders = await client.ai.text.translate
        .providers()
    translationProviders.forEach(p => console.info(p.name))

    // Basic smart routing
    const basicSmartRouting = await client.ai.text.translate
        .fulfill({
            text: "How's it going?",
            to: 'es'
        })
    prettyPrint('Basic smart routing', basicSmartRouting)

    // Using a service provider with your own keys
    const withKeys = await client.ai.text.translate
        .fulfill({
            text: "A sample text",
            to: 'es',
            provider: 'ai.text.translate.google.translate_api.2-0',
            auth: {
                'ai.text.translate.google.translate_api.2-0': [
                    {
                        key: process.env.YOUR_GOOGLE_KEY
                    }
                ]
            }
        })
    prettyPrint('Using a service provider with your own keys', withKeys)
}

tests().catch(console.error)
