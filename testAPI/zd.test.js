'use strict'
const fetch = require('node-fetch')
const IntentoConnector = require('../src/index')

// Quickly load .env files into the environment
require('dotenv').load()
const apikey = process.env.INTENTO_API_KEY
const host = process.env.INTENTO_API_HOST

const DEBUG = false

/**
 * ZD Client mockup
 *
 * https://developer.zendesk.com/apps/docs/developer-guide/using_sdk#using-secure-settings
 * @param {*} params all the params
 * @returns {undefined}
 */
class ZDClient {

    request(params) {

        const {
            url,
            headers,
            secure,
            type,
            contentType,
            data,
        } = params


        if (secure) {
            for (const key in headers) {
                headers[key] = headers[key].replace('{{setting.token}}', apikey)
            }
        }

        return fetch(url, {
            method: type,
            headers: { ...headers, 'content-type': contentType },
            body: type !== 'GET' ? data : undefined
        }).then(response => {
            // here mimicing zd request API as we understand it
            //

            // zd request API: https://developer.zendesk.com/apps/docs/core-api/client_api#client.requestoptions
            //
            // console.log(response.responseJSON); // body of the HTTP response
            // console.log(response.responseText); // body of the HTTP response
            // console.log(response.status);       // HTTP response status
            // console.log(response.statusText);   // Is either 'success' or 'error'
            // console.log(response.headers);      // HTTP response headers

            const { status, headers } = response

            return response.text().then(bodytext => {
                // it's not exactly clear whether JSON parsing error
                // forces zd request to return 'error', but let's consider this as true for now
                const zdResponse = { responseText: bodytext, status, statusText: 'error', headers }
                try {
                    zdResponse.responseJSON = JSON.parse(bodytext)
                    zdResponse.statusText = 'success'
                } catch (exception) {
                    zdResponse.error = exception
                }

                return zdResponse
            })
        })
    }
}

const zdclient = new ZDClient()
const HTTP_CODES = {
    404: 'Not Found'
}
/**
 * Fetcher function which can work with zendesk client
 * @param {*} param0 incoming parameters
 * @returns {undefined}
 */
function zdfetcher({ requestOptions, /*debug, verbose,*/ data, content }) {
    // console.log('zd fetcher ', requestOptions, data, content)
    let { headers, host, path, method } = requestOptions

    delete headers["content-type"]
    headers.apikey = "{{setting.token}}"
    return zdclient.request({
        url: `https://${host}${path}`, // for ex. api.inten.to/ai/text/translate
        headers,
        secure: true,
        type: method, // POST, GET, etc
        contentType: 'application/json',
        data: data || JSON.stringify(content) || ''
    }).then(zdresponse => {
        // console.log(' got zdresponse ', zdresponse)
        const { status, statusText } = zdresponse

        // default fetcher treats 404 as errors and throws, so should we

        // here other non 200 statues should be checked
        if (statusText === 'success' && status !== 404) {
            return zdresponse.responseJSON
        }

        // might be that zd request returns actual statusMessage in some undocumented field
        let error = { statusCode: status, statusMessage: HTTP_CODES[status] }
        try {
            error.error = zdresponse.responseJSON.error
        }
        catch (exception) {
            error.error = exception
        }
        throw error
    })

}



const client_for_zd = new IntentoConnector({ apikey, host }, { debug: DEBUG, fetcher: zdfetcher })

describe('zd fetcher test', () => {
    it('get translation', async () => {
        expect.assertions(10)
        const translate = await client_for_zd.ai.text.translate.fulfill({
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


    it('fails without options specified', async () => {
        expect.assertions(2)
        await client_for_zd.makeRequest().catch(e => {
            expect(e.statusCode).toEqual(404)
            expect(e.statusMessage).toEqual('Not Found')
        })
    })

    it('fails with an incorrect path specified: /', async () => {
        expect.assertions(2)
        await client_for_zd.makeRequest({ path: '/' }).catch(e => {
            expect(e.statusCode).toEqual(404)
            expect(e.statusMessage).toEqual('Not Found')
        })
    })

    it('fails with an incorrect path specified: /settings', async () => {
        expect.assertions(3)
        await client_for_zd.makeRequest({ path: '/settings' }).catch(e => {
            expect(e.error).toBeDefined()
            expect(e.error.code).toEqual(404)
            expect(e.error.message).toEqual('no such intent settings/')
        })
    })

    it('fails with an incorrect path specified: /ai', async () => {
        expect.assertions(3)
        await client_for_zd.makeRequest({ path: '/ai' }).catch(e => {
            expect(e.error).toBeDefined()
            expect(e.error.code).toEqual(404)
            expect(e.error.message).toEqual('no such intent ai/')
        })
    })

    it('fails with an incorrect path specified: /usage', async () => {
        expect.assertions(2)
        await client_for_zd
            .makeRequest({ path: '/usage' })
            .catch(e => {
                expect(e.error).toBeDefined()
                expect(e.error).toEqual('No such endpoint.')
                // expect(e.error.code).toEqual(404)
                // expect(e.error.message).toEqual('No such endpoint.')
            })
    })

    it('shows settings/languages', async () => {
        expect.assertions(1)
        const langSettings = await client_for_zd.makeRequest({
            path: '/settings/languages',
        })
        if (DEBUG) {
            console.info('Current apikey settings: ', langSettings)
        }

        expect(langSettings).toBeInstanceOf(Object)
    })
})
