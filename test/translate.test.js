'use strict'

const IntentoConnector = require('../src/index')

// Quickly load .env files into the environment
require('dotenv').load()
const apikey = process.env.INTENTO_API_KEY
const host = process.env.INTENTO_API_HOST

const DEBUG = false
const client = new IntentoConnector({ apikey, host }, { debug: DEBUG, curl: false, dryRun: true })

describe('ai.text.translate', () => {
    it('translate with processing', async () => {
        expect.assertions(2)
        const content = {
            text: ' A sample text ',
            to: 'es',
            provider: 'ai.text.translate.microsoft.translator_text_api.2-0',
        }
        const sampleRequest = {
            context: { text: ' A sample text ', to: 'es' },
            service: {
                provider: ['ai.text.translate.microsoft.translator_text_api.2-0'],
                processing: {},
            },
        }

        const content2 = {
            ...content,
            processing: {
                // spaces should be trimmed
                pre: ['punctuation_set'],
                post: ['punctuation_set'],
            },
        }
        const sampleRequest2 = {
            context: { text: ' A sample text ', to: 'es' },
            service: {
                provider: ['ai.text.translate.microsoft.translator_text_api.2-0'],
                processing: { pre: ['punctuation_set'], post: ['punctuation_set'] },
            },
        }

        const response = await client.ai.text.translate.fulfill(content)
        const response2 = await client.ai.text.translate.fulfill(content2)

        expect(t(response, null, 4)).toEqual(t(sampleRequest))
        expect(t(response2)).toEqual(t(sampleRequest2))
    })
})

function t(obj) {
    if (typeof obj === 'string') {
        return obj
    }
    try {
        return JSON.stringify(obj, null, 4)
    } catch (e) {
        console.error(e)

        return ''
    }
}
