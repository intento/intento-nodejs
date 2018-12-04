'use strict'

const IntentoConnector = require('../src/index')
const { stringify: t } = require('./utils')

// Quickly load .env files into the environment
require('dotenv').load()
const apikey = process.env.INTENTO_API_KEY
const host = process.env.INTENTO_API_HOST

const DEBUG = false
const client = new IntentoConnector({ apikey, host }, { debug: DEBUG, dryRun: true })

describe('languages information', () => {
    it('get text translate language', async () => {
        expect.assertions(1)
        const response = await client.ai.text.translate.languages()
        expect(t(response)).toEqual(t('/ai/text/translate/languages'))
    })
    it('get text sentiment languages', async () => {
        expect.assertions(1)
        const response = await client.ai.text.sentiment.languages()
        expect(t(response)).toEqual(t('/ai/text/sentiment/languages'))
    })
    it('get text dictionary languages', async () => {
        expect.assertions(1)
        const response = await client.ai.text.dictionary.languages()
        expect(t(response)).toEqual(t('/ai/text/dictionary/languages'))
    })
    it('get text classify languages', async () => {
        expect.assertions(1)
        const response = await client.ai.text.classify.languages()
        expect(t(response)).toEqual(t('/ai/text/classify/languages'))
    })
    it('get text transliterate languages', async () => {
        expect.assertions(1)
        const response = await client.ai.text.transliterate.languages()
        expect(t(response)).toEqual(t('/ai/text/transliterate/languages'))
    })
    it('get text detect-intent languages', async () => {
        expect.assertions(1)
        const response = await client.ai.text['detect-intent'].languages()
        expect(t(response)).toEqual(t('/ai/text/detect-intent/languages'))
    })
})
