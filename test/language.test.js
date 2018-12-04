'use strict'

const IntentoConnector = require('../src/index')
const { stringify: t } = require('./utils')

// Quickly load .env files into the environment
require('dotenv').load()
const apikey = process.env.INTENTO_API_KEY
const host = process.env.INTENTO_API_HOST

const DEBUG = false
const client = new IntentoConnector({ apikey, host }, { debug: DEBUG, dryRun: true })
const langCode = "ru"

describe('language information', () => {
    it('get text translate language', async () => {
        expect.assertions(1)
        const response = await client.ai.text.translate.language(langCode)
        expect(t(response)).toEqual(t('/ai/text/translate/languages/' + langCode))
    })
    it('get text sentiment language', async () => {
        expect.assertions(1)
        const response = await client.ai.text.sentiment.language(langCode)
        expect(t(response)).toEqual(t('/ai/text/sentiment/languages/' + langCode))
    })
    it('get text dictionary language', async () => {
        expect.assertions(1)
        const response = await client.ai.text.dictionary.language(langCode)
        expect(t(response)).toEqual(t('/ai/text/dictionary/languages/' + langCode))
    })
    it('get text classify language', async () => {
        expect.assertions(1)
        const response = await client.ai.text.classify.language(langCode)
        expect(t(response)).toEqual(t('/ai/text/classify/languages/' + langCode))
    })
    it('get text transliterate language', async () => {
        expect.assertions(1)
        const response = await client.ai.text.transliterate.language(langCode)
        expect(t(response)).toEqual(t('/ai/text/transliterate/languages/' + langCode))
    })
    it('get text detect-intent language', async () => {
        expect.assertions(1)
        const response = await client.ai.text['detect-intent'].language(langCode)
        expect(t(response)).toEqual(t('/ai/text/detect-intent/languages/' + langCode))
    })
})
