'use strict'

const IntentoConnector = require('../src/index')

// Quickly load .env files into the environment
require('dotenv').load()
const apikey = process.env.INTENTO_API_KEY

const DEBUG = false
const client = new IntentoConnector({ apikey }, DEBUG)

describe('Export', () => {
    it('loads', () => {
        expect(IntentoConnector).toBeDefined()
        expect(apikey).toBeDefined()
    })
})

describe('Basic', () => {
    it('instantiated', () => {
        expect(client).toBeDefined()
        expect(client.credentials).toBeDefined()
        expect(client.credentials.apikey).toBeDefined()
    })

    it('has correct structure', () => {
        expect(client.ai).toBeDefined()
        expect(client.ai.text).toBeDefined()

        expect(client.ai.text.translate).toBeDefined()
        expect(typeof client.ai.text.translate.fulfill).toBe('function')
        expect(typeof client.ai.text.translate.providers).toBe('function')
        expect(typeof client.ai.text.translate.provider).toBe('function')
        expect(typeof client.ai.text.translate.languages).toBe('function')

        expect(client.ai.text.sentiment).toBeDefined()
        expect(typeof client.ai.text.sentiment.fulfill).toBe('function')
        expect(typeof client.ai.text.sentiment.providers).toBe('function')
        expect(typeof client.ai.text.sentiment.provider).toBe('function')

        expect(client.ai.text.dictionary).toBeDefined()
        expect(typeof client.ai.text.dictionary.fulfill).toBe('function')
        expect(typeof client.ai.text.dictionary.providers).toBe('function')
        expect(typeof client.ai.text.dictionary.provider).toBe('function')
        expect(typeof client.ai.text.dictionary.languages).toBe('function')

        expect(client.ai.settings).toBeDefined()
        expect(typeof client.ai.settings.languages).toBe('function')
    })
})

describe('Translation Intent', () => {
    it('Fulfill returns a promise', () => {
        const ret = client.ai.text.translate.fulfill()
        expect(ret instanceof Promise).toBe(true)
    })
    it('Providers returns a promise', () => {
        const ret = client.ai.text.translate.providers()
        expect(ret instanceof Promise).toBe(true)
    })
    it('Provider returns a promise', () => {
        const ret = client.ai.text.translate.provider('')
        expect(ret instanceof Promise).toBe(true)
    })
    it('Languages returns a promise', () => {
        const ret = client.ai.text.translate.languages()
        expect(ret instanceof Promise).toBe(true)
    })
})

describe('Sentiment Intent', () => {
    it('Fulfill returns a promise', () => {
        const ret = client.ai.text.sentiment.fulfill({
            provider: 'a-provider',
        })
        expect(ret instanceof Promise).toBe(true)
    })
    it('Providers returns a promise', () => {
        const ret = client.ai.text.sentiment.providers()
        expect(ret instanceof Promise).toBe(true)
    })
    it('Provider returns a promise', () => {
        const ret = client.ai.text.sentiment.provider('')
        expect(ret instanceof Promise).toBe(true)
    })
})

describe('Dictionary Intent', () => {
    it('Fulfill returns a promise', () => {
        const ret = client.ai.text.dictionary.fulfill()
        expect(ret instanceof Promise).toBe(true)
    })
    it('Providers returns a promise', () => {
        const ret = client.ai.text.dictionary.providers()
        expect(ret instanceof Promise).toBe(true)
    })
    it('Provider returns a promise', () => {
        const ret = client.ai.text.dictionary.provider('')
        expect(ret instanceof Promise).toBe(true)
    })
    it('Languages returns a promise', () => {
        const ret = client.ai.text.dictionary.languages()
        expect(ret instanceof Promise).toBe(true)
    })
})
