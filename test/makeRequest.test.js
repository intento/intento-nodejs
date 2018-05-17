'use strict'

const IntentoConnector = require('../src/index')

// Quickly load .env files into the environment
require('dotenv').load()
const apikey = process.env.INTENTO_API_KEY

const DEBUG = false
const client = new IntentoConnector({ apikey }, DEBUG)

describe('makeRequest', () => {
    it('fails without options specified', async () => {
        expect.assertions(2)
        return client.makeRequest().catch(e => {
            expect(e.statusCode).toEqual(404)
            expect(e.statusMessage).toEqual('Not Found')
        })
    })

    it('fails with an incorrect path specified: /', async () => {
        expect.assertions(1)
        return client.makeRequest({ path: '/' }).catch(e => expect(e.statusCode).toEqual(404))
    })

    it('fails with an incorrect path specified: /settings', async () => {
        expect.assertions(1)
        return client.makeRequest({ path: '/settings' }).catch(e => expect(e.statusCode).toEqual(404))
    })

    it('fails with an incorrect path specified: /ai', async () => {
        expect.assertions(1)
        return client.makeRequest({ path: '/ai' }).catch(e => expect(e.statusCode).toEqual(404))
    })

    it('makeRequest returns a promise', () => {
        expect(client.makeRequest({ path: '/settings/languages' }) instanceof Promise).toBe(true)
    })

    it('shows settings/languages', async () => {
        expect.assertions(1)
        const langSettings = await client.makeRequest({ path: '/settings/languages' })
        console.info('Current apikey settings: ', langSettings)

        expect(typeof langSettings).toBe('object')
    })
})
