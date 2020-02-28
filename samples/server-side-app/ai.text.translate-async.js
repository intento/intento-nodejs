const client = require('./index')

client.ai.text.translate
    .fulfill({
        text: "How's it going?",
        to: 'es',
        async: true,
        awaitAsync: true,
    })
    .then(res => {
        console.log(JSON.stringify(res, null, 4))
    })
    .catch(console.error)
