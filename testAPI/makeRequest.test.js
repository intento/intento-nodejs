'use strict'

const IntentoConnector = require('../src/index')

// Quickly load .env files into the environment
require('dotenv').load()
const apikey = process.env.INTENTO_API_KEY
const host = process.env.INTENTO_API_HOST

const DEBUG = false
const client = new IntentoConnector({ apikey, host }, { debug: DEBUG })

describe('makeRequest Live', () => {
    it('fails without options specified', async () => {
        expect.assertions(2)
        await client.makeRequest().catch(e => {
            expect(e.statusCode).toEqual(404)
            expect(e.statusMessage).toEqual('Not Found')
        })
    })

    it('fails with an incorrect path specified: /', async () => {
        expect.assertions(2)
        await client.makeRequest({ path: '/' }).catch(e => {
            expect(e.statusCode).toEqual(404)
            expect(e.statusMessage).toEqual('Not Found')
        })
    })

    it('fails with an incorrect path specified: /settings', async () => {
        expect.assertions(3)
        await client.makeRequest({ path: '/settings' }).then(e => {
            expect(e.error).toBeDefined()
            expect(e.error.code).toEqual(404)
            expect(e.error.message).toEqual('no such intent')
        })
    })

    it('fails with an incorrect path specified: /ai', async () => {
        expect.assertions(3)
        await client.makeRequest({ path: '/ai' }).then(e => {
            expect(e.error).toBeDefined()
            expect(e.error.code).toEqual(404)
            expect(e.error.message).toEqual('no such intent')
        })
    })

    it('fails with an incorrect path specified: /usage', async () => {
        expect.assertions(3)
        await client
            .makeRequest({ path: '/usage' })
            .then(e => {
                expect(e.error).toBeDefined()
                expect(e.error.code).toEqual(404)
                expect(e.error.message).toEqual('no such intent')
            })
            .catch(e => {
                expect(e.error).toBeUndefined()
                expect(e.statusCode).toEqual(404)
                expect(e.statusMessage).toEqual('Not Found')
            })
    })

    it('shows settings/languages', async () => {
        expect.assertions(1)
        const langSettings = await client.makeRequest({
            path: '/settings/languages',
        })
        if (DEBUG) {
            console.info('Current apikey settings: ', langSettings)
        }

        expect(langSettings).toBeInstanceOf(Object)
    })
})
