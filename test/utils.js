/**
 * transforms object to a pretty string (json formatted)
 *
 * @param {object|string} obj any object or string
 * @returns {string} string as is or json pretty-stringified object
 */
function stringify(obj) {
    if (typeof obj === 'string') {
        return obj
    }
    try {
        return JSON.stringify(obj, null, 4)
    } catch (e) {
        console.error(e)

        return ''
    }
}

module.exports = {
    stringify,
}
