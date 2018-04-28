const client = require('./index')

// Language detection mode (no `from` parameter)
client.ai.text.sentiment
    .fulfill({
        text: 'We love this place',
        lang: 'en',
        provider: 'ai.text.sentiment.meaningcloud.sentiment_analysis_api.2-1',
    })
    .then(console.log)
    .catch(console.error)

client.ai.text.sentiment
    .providers({ bulk: true })
    .then(console.log)
    .then(data => data.forEach(p => console.info(p.name)))
    .catch(console.error)

// Bulk mode
client.ai.text.sentiment
    .fulfill({
        text: ['We love this shop!', 'The quality is not as good as it should'],
        lang: 'en',
        provider: 'ai.text.sentiment.ibm.natural_language_understanding',
    })
    .then(console.log)
    .catch(console.error)

// more examples on exploring providers in ./explore-providers.js
