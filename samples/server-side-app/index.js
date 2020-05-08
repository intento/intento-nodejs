'use strict'

const IntentoConnector = require('../../src')
const apikey = process.env.INTENTO_API_KEY
const host = process.env.INTENTO_API_HOST
const client = new IntentoConnector({ apikey, host }, { curl: false })

module.exports = client
