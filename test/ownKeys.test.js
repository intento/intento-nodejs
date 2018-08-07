'use strict'
const IntentoConnector = require('../src/index')
const { stringify: t } = require('./utils')

// Quickly load .env files into the environment
require('dotenv').load()
const apikey = process.env.INTENTO_API_KEY
const host = process.env.INTENTO_API_HOST

const DEBUG = false
const client = new IntentoConnector({ apikey, host }, { debug: DEBUG, dryRun: true })

describe('auth with own keys', () => {
    it('forms correct request object when auth is a stringified object with credentials', async () => {
        expect.assertions(1)
        const content = {
            text: 'Sample text',
            to: 'es',
            provider: 'some-provider',
            auth: JSON.stringify({
                key: 'value',
            }),
        }
        const sampleRequest = {
            context: { text: 'Sample text', to: 'es' },
            service: {
                provider: ['some-provider'],
                auth: { 'some-provider': [{ key: 'value' }] },
            },
        }
        const requestObj = await client.ai.text.translate.fulfill(content)
        expect(t(requestObj)).toEqual(t(sampleRequest))
    })
})
