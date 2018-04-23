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
        expect(client.ai.text.sentiment).toBeDefined()
        expect(client.ai.text.dictionary).toBeDefined()
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
})
