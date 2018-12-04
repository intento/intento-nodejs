'use strict'

const IntentoConnector = require('../src/index')
const { stringify: t } = require('./utils')

// Quickly load .env files into the environment
require('dotenv').load()
const apikey = process.env.INTENTO_API_KEY
const host = process.env.INTENTO_API_HOST

const DEBUG = false
const client = new IntentoConnector({ apikey, host }, { debug: DEBUG, dryRun: true })
const providerId = "ai.contentType.category.fake.provider"

describe('provider information', () => {
    it('get text translate provider', async () => {
        expect.assertions(1)
        const response = await client.ai.text.translate.provider(providerId)
        expect(t(response)).toEqual(t('/ai/text/translate/' + providerId))
    })
    it('get text sentiment provider', async () => {
        expect.assertions(1)
        const response = await client.ai.text.sentiment.provider(providerId)
        expect(t(response)).toEqual(t('/ai/text/sentiment/' + providerId))
    })
    it('get text dictionary provider', async () => {
        expect.assertions(1)
        const response = await client.ai.text.dictionary.provider(providerId)
        expect(t(response)).toEqual(t('/ai/text/dictionary/' + providerId))
    })
    it('get text classify provider', async () => {
        expect.assertions(1)
        const response = await client.ai.text.classify.provider(providerId)
        expect(t(response)).toEqual(t('/ai/text/classify/' + providerId))
    })
    it('get text transliterate provider', async () => {
        expect.assertions(1)
        const response = await client.ai.text.transliterate.provider(providerId)
        expect(t(response)).toEqual(t('/ai/text/transliterate/' + providerId))
    })
    it('get text detect-intent provider', async () => {
        expect.assertions(1)
        const response = await client.ai.text['detect-intent'].provider(providerId)
        expect(t(response)).toEqual(t('/ai/text/detect-intent/' + providerId))
    })
    it('get image tagging provider', async () => {
        expect.assertions(1)
        const response = await client.ai.image.tagging.provider(providerId)
        expect(t(response)).toEqual(t('/ai/image/tagging/' + providerId))
    })
    it('get image ocr provider', async () => {
        expect.assertions(1)
        const response = await client.ai.image.ocr.provider(providerId)
        expect(t(response)).toEqual(t('/ai/image/ocr/' + providerId))
    })
    it('get speech transcribe provider', async () => {
        expect.assertions(1)
        const response = await client.ai.speech.transcribe.provider(providerId)
        expect(t(response)).toEqual(t('/ai/speech/transcribe/' + providerId))
    })
    it('get speech transcribe provider with params', async () => {
        expect.assertions(1)
        const response = await client.ai.speech.transcribe.provider(providerId, {})
        expect(t(response)).toEqual(t('/ai/speech/transcribe/' + providerId))
    })
})
