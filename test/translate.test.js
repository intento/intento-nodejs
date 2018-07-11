'use strict'

const IntentoConnector = require('../src/index')

// Quickly load .env files into the environment
require('dotenv').load()
const apikey = process.env.INTENTO_API_KEY
const host = process.env.INTENTO_API_HOST

const DEBUG = false
const client = new IntentoConnector({ apikey, host }, { debug: DEBUG })

describe('ai.text.translate', () => {
    it('translate with processing', async () => {
        expect.assertions(3)
        const content = {
            text: ' A sample text ',
            to: 'es',
            provider: 'ai.text.translate.microsoft.translator_text_api.2-0',
        }
        const content2 = {
            ...content,
            processing: {
                // spaces are trimmed
                pre: ['punctuation_set'],
                post: ['punctuation_set'],
            },
        }

        const response = await client.ai.text.translate.fulfill(content)
        const response2 = await client.ai.text.translate.fulfill(content2)
        expect(response.results.length > 0).toBe(true)
        expect(response2.results.length > 0).toBe(true)
        expect(response.results[0] === response2.results[0]).toBe(false) // spaces should be trimmed
    })
})
