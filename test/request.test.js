'use strict'

jest.mock('axios')
const axios = require('axios')
const IntentoConnector = require('../src/index')

const apikey = 'test-apikey'
const host = 'api.example.test'

beforeEach(() => {
    axios.request.mockReset()
})

describe('makeRequest in dry run mode', () => {
    const client = new IntentoConnector({ apikey, host }, { dryRun: true })

    it('resolves with the request path and sends nothing', async () => {
        await expect(client.makeRequest({ path: '/settings/languages' })).resolves.toEqual(
            '/settings/languages'
        )
        expect(axios.request).not.toHaveBeenCalled()
    })
})

describe('makeRequest over axios', () => {
    const client = new IntentoConnector({ apikey, host })

    it('builds a GET request with query params and resolves the parsed body', async () => {
        axios.request.mockResolvedValue({ status: 200, statusText: 'OK', data: '{"ok": true}' })

        await expect(
            client.makeRequest({ path: '/ai/text/translate/languages', params: { locale: 'de' } })
        ).resolves.toEqual({ ok: true })

        expect(axios.request).toHaveBeenCalledTimes(1)
        const options = axios.request.mock.calls[0][0]
        expect(options.url).toEqual(
            'https://api.example.test/ai/text/translate/languages?locale=de'
        )
        expect(options.method).toEqual('GET')
        expect(options.data).toBeUndefined()
        expect(options.responseType).toEqual('text')
        expect(options.validateStatus(500)).toBe(true)
        expect(options.headers.apikey).toEqual(apikey)
        expect(options.headers['content-type']).toEqual('application/json')
        expect(options.headers['User-Agent']).toMatch(/^Intento\.NodeJS\//)
    })

    it('keeps the host fixed when the path lacks a leading slash', async () => {
        axios.request.mockResolvedValue({ status: 200, statusText: 'OK', data: '{}' })
        for (const path of ['@evil.example/x', '//evil.example/x', 'settings']) {
            await client.makeRequest({ path })
            const { url } = axios.request.mock.calls.pop()[0]
            expect(new URL(url).host).toEqual(host)
            expect(url.startsWith(`https://${host}/`)).toBe(true)
        }
    })

    it('does not follow redirects, so a 3xx reaches the handler with the key unsent', async () => {
        axios.request.mockResolvedValue({ status: 302, statusText: 'Found', data: '' })

        await expect(client.makeRequest({ path: '/x' })).resolves.toBeNull()
        expect(axios.request.mock.calls[0][0].maxRedirects).toBe(0)
    })

    it('sends content as a JSON string body on POST', async () => {
        axios.request.mockResolvedValue({ status: 200, statusText: 'OK', data: '{"id": "op-1"}' })
        const content = { context: { text: 'hi', to: 'es' } }

        await expect(
            client.makeRequest({ path: '/ai/text/translate', method: 'POST', content })
        ).resolves.toEqual({ id: 'op-1' })

        const options = axios.request.mock.calls[0][0]
        expect(options.method).toEqual('POST')
        expect(options.data).toEqual(JSON.stringify(content))
    })

    it('rejects with the API error object on 4xx', async () => {
        axios.request.mockResolvedValue({
            status: 404,
            statusText: 'Not Found',
            data: '{"error": {"code": 404, "message": "no such intent ai/"}}',
        })

        await expect(client.makeRequest({ path: '/ai' })).rejects.toEqual({
            error: { code: 404, message: 'no such intent ai/' },
        })
    })

    it('rejects with the transport error instead of hanging', async () => {
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
        const err = Object.assign(new Error('getaddrinfo ENOTFOUND'), { code: 'ENOTFOUND' })
        axios.request.mockRejectedValue(err)

        await expect(client.makeRequest({ path: '/ai' })).rejects.toBe(err)
        spy.mockRestore()
    })
})
