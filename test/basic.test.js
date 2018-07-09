'use strict'

const IntentoConnector = require('../src/index')

// Quickly load .env files into the environment
require('dotenv').load()
const apikey = process.env.INTENTO_API_KEY

const DEBUG = false
const client = new IntentoConnector({ apikey }, { debug: DEBUG })

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
        expect(typeof client.ai.text.translate.language).toBe('function')

        expect(client.ai.text.sentiment).toBeDefined()
        expect(typeof client.ai.text.sentiment.fulfill).toBe('function')
        expect(typeof client.ai.text.sentiment.providers).toBe('function')
        expect(typeof client.ai.text.sentiment.provider).toBe('function')

        expect(client.ai.text.dictionary).toBeDefined()
        expect(typeof client.ai.text.dictionary.fulfill).toBe('function')
        expect(typeof client.ai.text.dictionary.providers).toBe('function')
        expect(typeof client.ai.text.dictionary.provider).toBe('function')
        expect(typeof client.ai.text.dictionary.languages).toBe('function')

        expect(client.settings).toBeDefined()
        expect(typeof client.settings.languages).toBe('function')
        expect(typeof client.settings.processingRules).toBe('function')

        expect(client.operations).toBeDefined()
        expect(typeof client.operations.fulfill).toBe('function')

        expect(typeof client.makeRequest).toBe('function')
    })
})

describe('Translation Intent', () => {
    it('Fulfill returns a promise', () => {
        const ret = client.ai.text.translate.fulfill()
        expect(ret instanceof Promise).toBe(true)
        ret.catch(prettyCatch)
    })
    it('Providers returns a promise', () => {
        const ret = client.ai.text.translate.providers()
        expect(ret instanceof Promise).toBe(true)
        ret.catch(prettyCatch)
    })
    it('Provider returns a promise', () => {
        const ret = client.ai.text.translate.provider('')
        expect(ret instanceof Promise).toBe(true)
        ret.catch(prettyCatch)
    })
    it('Languages returns a promise', () => {
        const ret = client.ai.text.translate.languages()
        expect(ret instanceof Promise).toBe(true)
        ret.catch(prettyCatch)
    })
    it('Language returns a promise', () => {
        const ret = client.ai.text.translate.language()
        expect(ret instanceof Promise).toBe(true)
        ret.catch(prettyCatch)
    })
})

describe('Sentiment Intent', () => {
    it('Fulfill returns a promise', () => {
        const ret = client.ai.text.sentiment.fulfill({
            provider: 'a-provider',
        })
        expect(ret instanceof Promise).toBe(true)
        ret.catch(prettyCatch)
    })
    it('Providers returns a promise', () => {
        const ret = client.ai.text.sentiment.providers()
        expect(ret instanceof Promise).toBe(true)
        ret.catch(prettyCatch)
    })
    it('Provider returns a promise', () => {
        const ret = client.ai.text.sentiment.provider('')
        expect(ret instanceof Promise).toBe(true)
        ret.catch(prettyCatch)
    })
})

describe('Dictionary Intent', () => {
    it('Fulfill returns a promise', () => {
        const ret = client.ai.text.dictionary.fulfill()
        expect(ret instanceof Promise).toBe(true)
        ret.catch(prettyCatch)
    })
    it('Providers returns a promise', () => {
        const ret = client.ai.text.dictionary.providers()
        expect(ret instanceof Promise).toBe(true)
        ret.catch(prettyCatch)
    })
    it('Provider returns a promise', () => {
        const ret = client.ai.text.dictionary.provider('')
        expect(ret instanceof Promise).toBe(true)
        ret.catch(prettyCatch)
    })
    it('Languages returns a promise', () => {
        const ret = client.ai.text.dictionary.languages()
        expect(ret instanceof Promise).toBe(true)
        ret.catch(prettyCatch)
    })
})

function prettyCatch(errorResponse) {
    console.log('\nError: ', errorResponse.statusCode, errorResponse.statusMessage)
}
