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
            provider: 'some-provider',
            auth: JSON.stringify({
                key: 'value',
            }),
        }
        const sampleRequest = {
            context: {},
            service: {
                provider: 'some-provider',
                auth: { 'some-provider': [{ key: 'value' }] },
                async: true,
            },
        }
        const requestObj = await client.ai.text.translate.fulfill(content)
        expect(t(requestObj)).toEqual(t(sampleRequest))
    })

    it('fails without provider', async () => {
        expect.assertions(2)
        const content = {
            // no provider specified
            auth: JSON.stringify({
                key: 'value',
            }),
        }

        try {
            await client.ai.text.translate.fulfill(content)
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
            expect(e.message).toBeDefined()
        }
    })
})
