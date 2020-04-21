const client = require('./index')
const utils = require('./utils')
const { prettyPrint, printProvidersInfo } = utils

const intent = client.ai.text["detect-language"]

// eslint-disable-next-line require-jsdoc
async function tests() {
    const test1 = await intent.fulfill({
        text: 'We love this place',
    })
    prettyPrint(test1)

    const test2 = await intent.fulfill({
        text: 'ми любимо це місце',
    })
    prettyPrint(test2)

    const data = await intent.providers()
    printProvidersInfo(data)
}

tests().catch(console.error)
