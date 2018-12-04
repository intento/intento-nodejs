const {
    ERROR_MESSAGE_PREFIX,
    // getPath,
    // responseHandler,
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