'use strict'

const IntentoConnector = require('../src/index')

// Quickly load .env files into the environment
require('dotenv').config()
const apikey = process.env.INTENTO_API_KEY
const host = process.env.INTENTO_API_HOST

const DEBUG = false
const client = new IntentoConnector({ apikey, host }, { debug: DEBUG })

describe('makeRequest Live', () => {
    it('get translation', async () => {
        expect.assertions(10)
        const translate = await client.ai.text.translate.fulfill({
            text: 'A sample text',
            to: 'es',
        })
        if (DEBUG) {
            console.info('Current apikey settings: ', translate)
        }

        expect(translate).toBeInstanceOf(Object)
        expect(translate.hasOwnProperty('id')).toBeTruthy()
        expect(translate.hasOwnProperty('done')).toBeTruthy()
        expect(translate.hasOwnProperty('response')).toBeTruthy()
        expect(translate.hasOwnProperty('meta')).toBeTruthy()
        expect(translate.hasOwnProperty('error')).toBeTruthy()

        const res = translate.response[0]
        expect(res).toBeDefined()
        expect(res.hasOwnProperty('results')).toBeTruthy()
        expect(res.hasOwnProperty('meta')).toBeTruthy()
        expect(res.hasOwnProperty('service')).toBeTruthy()
    })
})
