'use strict'

const IntentoConnector = require('../src/index')

// Quickly load .env files into the environment
require('dotenv').load()
const apikey = process.env.INTENTO_API_KEY
const host = process.env.INTENTO_API_HOST

const DEBUG = false
const client = new IntentoConnector({ apikey, host }, { debug: DEBUG, dryRun: true })

describe('makeRequest', () => {
    it('makeRequest returns a promise', () => {
        expect(client.makeRequest({ path: '/settings/languages' }) instanceof Promise).toBe(true)
    })
})
