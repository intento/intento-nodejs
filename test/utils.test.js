const {
    ERROR_MESSAGE_PREFIX,
    // getPath,
    responseHandler,
    // customErrorLog,
    // stringToList,
    ownCredentials,
} = require('../src/utils')
const { stringify: t } = require('./utils')

describe('ownCredentials', () => {
    it('throws with auth and without providers', () => {
        expect.assertions(3)
        try {
            ownCredentials('auth')
        } catch(e) {
            expect(e).toBeInstanceOf(Error)
            expect(e.message).toBeDefined()
            expect(e.message.startsWith(ERROR_MESSAGE_PREFIX)).toBeTruthy()
        }
    })

    it('throws with invalid auth', () => {
        expect.assertions(3)
        try {
            ownCredentials('auth')
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
            expect(e.message).toBeDefined()
            expect(e.message.startsWith(ERROR_MESSAGE_PREFIX)).toBeTruthy()
        }
    })

    it('throws with auth and with empty provider list', () => {
        expect.assertions(3)
        try {
            ownCredentials('{ "cred": "value" }', [])
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
            expect(e.message).toBeDefined()
            expect(e.message.startsWith(ERROR_MESSAGE_PREFIX)).toBeTruthy()
        }
    })

    it('throws with invalid auth', () => {
        expect.assertions(3)

        try {
            ownCredentials('{', ['some-provider'])
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
            expect(e.message).toBeDefined()
            expect(e.message.startsWith(ERROR_MESSAGE_PREFIX)).toBeTruthy()
        }
    })

    it('throws with another invalid auth', () => {
        expect.assertions(3)

        try {
            ownCredentials('[', ['some-provider'])
        } catch (e) {
            expect(e).toBeInstanceOf(Error)
            expect(e.message).toBeDefined()
            expect(e.message.startsWith(ERROR_MESSAGE_PREFIX)).toBeTruthy()
        }
    })

    it('does not modify auth when object', () => {
        expect.assertions(1)
        const auth = { key: 'value' }
        const auth2 = ownCredentials(auth, ['some-provider'])
        expect(t(auth)).toEqual(t(auth2))
    })

    it('does not modify auth when object', () => {
        expect.assertions(1)
        const auth = { 'some-provider': [{ key: 'value' }] }
        const auth2 = ownCredentials(JSON.stringify(auth), ['some-provider'])

        expect(t(auth)).toEqual(t(auth2))
    })

    it('accepts list of keys', () => {
        expect.assertions(1)
        const auth = [{ key: 'value' }]
        const someProvider = 'some-provider'
        const auth2 = ownCredentials(JSON.stringify(auth), [someProvider])
        expect(t({ [someProvider]: auth })).toEqual(t(auth2))
    })
})
describe('responseHandler', () => {
    const handle = response =>
        new Promise((resolve, reject) => responseHandler(response, resolve, reject))
    const ok = body => ({ statusCode: 200, statusMessage: 'OK', body })
    const notFound = body => ({ statusCode: 404, statusMessage: 'Not Found', body })

    it('resolves parsed JSON objects and arrays', async () => {
        await expect(handle(ok('{"a": 1}'))).resolves.toEqual({ a: 1 })
        await expect(handle(ok('[1, 2]'))).resolves.toEqual([1, 2])
    })
    it('resolves null for an empty body', async () => {
        await expect(handle(ok(''))).resolves.toBeNull()
    })
    it('maps a bare OK body to a status object', async () => {
        await expect(handle(ok('OK'))).resolves.toEqual({ status: 'OK' })
    })
    it('rejects with the API error object when the body has one', async () => {
        const body = '{"error": {"code": 404, "message": "no such intent ai/"}}'
        await expect(handle(notFound(body))).rejects.toEqual({
            error: { code: 404, message: 'no such intent ai/' },
        })
    })
    it('rejects with status fields when a 4xx body has no error key', async () => {
        await expect(handle(notFound('{"detail": "x"}'))).rejects.toEqual({
            statusCode: 404,
            statusMessage: 'Not Found',
            detail: 'x',
        })
        await expect(handle(notFound(''))).rejects.toEqual({
            statusCode: 404,
            statusMessage: 'Not Found',
        })
    })
    it('rejects with the raw response for HTML or garbage bodies', async () => {
        const html = notFound('<html>nope</html>')
        await expect(handle(html)).rejects.toBe(html)
        const garbage = ok('not json')
        await expect(handle(garbage)).rejects.toBe(garbage)
    })
    it('logs and rejects on 5xx', async () => {
        const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
        const response = { statusCode: 502, statusMessage: 'Bad Gateway', body: '' }
        await expect(handle(response)).rejects.toEqual({
            statusCode: 502,
            statusMessage: 'Bad Gateway',
        })
        expect(spy).toHaveBeenCalledWith('', 502, 'Bad Gateway')
        spy.mockRestore()
    })
})
