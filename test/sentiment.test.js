'use strict'

const IntentoConnector = require('../src/index')
const { stringify: t } = require('./utils')

// Quickly load .env files into the environment
require('dotenv').load()
const apikey = process.env.INTENTO_API_KEY
const host = process.env.INTENTO_API_HOST

const DEBUG = false
const client = new IntentoConnector({ apikey, host }, { debug: DEBUG, dryRun: true })

describe('ai.text.sentiment', () => {
    it('get sentiment languages', async () => {
        expect.assertions(4)

        const response = await client.ai.text.sentiment.languages()
        const with_locale = { locale: 'de' }
        const response2 = await client.ai.text.sentiment.languages(with_locale)
        const response3 = await client.ai.text.sentiment.language('fr')
        const response4 = await client.ai.text.sentiment.language('fr', with_locale)

        expect(t(response)).toEqual(t('/ai/text/sentiment/languages'))
        expect(t(response2)).toEqual(t('/ai/text/sentiment/languages?locale=de'))
        expect(t(response3)).toEqual(t('/ai/text/sentiment/languages/fr'))
        expect(t(response4)).toEqual(t('/ai/text/sentiment/languages/fr?locale=de'))
    })
})
