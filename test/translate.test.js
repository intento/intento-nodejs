'use strict'

const IntentoConnector = require('../src/index')
const { stringify: t } = require('./utils')

// Quickly load .env files into the environment
require('dotenv').load()
const apikey = process.env.INTENTO_API_KEY
const host = process.env.INTENTO_API_HOST

const DEBUG = false
const client = new IntentoConnector({ apikey, host }, { debug: DEBUG, dryRun: true })

const CONTENT = {
    text: ' A sample text ',
    to: 'es',
    provider: 'ai.text.translate.microsoft.translator_text_api.2-0',
}
const SAMPLE_REQUEST = {
    context: { text: ' A sample text ', to: 'es' },
    service: {
        provider: ['ai.text.translate.microsoft.translator_text_api.2-0'],
        async: true,
    },
}

describe('ai.text.translate', () => {
    it('get translate languages', async () => {
        expect.assertions(4)

        const response = await client.ai.text.translate.languages()
        const with_locale = { locale: 'de' }
        const response2 = await client.ai.text.translate.languages(with_locale)
        const response3 = await client.ai.text.translate.language('fr')
        const response4 = await client.ai.text.translate.language('fr', with_locale)

        expect(t(response)).toEqual(t('/ai/text/translate/languages'))
        expect(t(response2)).toEqual(t('/ai/text/translate/languages?locale=de'))
        expect(t(response3)).toEqual(t('/ai/text/translate/languages/fr'))
        expect(t(response4)).toEqual(t('/ai/text/translate/languages/fr?locale=de'))
    })
    it('translate without processing', async () => {
        expect.assertions(1)

        const response = await client.ai.text.translate.fulfill(CONTENT)

        expect(t(response)).toEqual(t(SAMPLE_REQUEST))
    })
    it('translate with processing', async () => {
        expect.assertions(1)
        const content = {
            ...CONTENT,
            processing: {
                // spaces should be trimmed
                pre: ['punctuation_set'],
                post: ['punctuation_set'],
            },
        }
        const sampleRequest = {
            ...SAMPLE_REQUEST,
            service: {
                ...SAMPLE_REQUEST.service,
                async: true,
                processing: { pre: ['punctuation_set'], post: ['punctuation_set'] },
            },
        }

        const response = await client.ai.text.translate.fulfill(content)

        expect(t(response)).toEqual(t(sampleRequest))
    })
})
