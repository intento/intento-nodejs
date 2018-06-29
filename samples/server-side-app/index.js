'use strict'

const IntentoConnector = require('../../src')
const apikey = process.env.INTENTO_API_KEY
const client = new IntentoConnector({ apikey })

module.exports = client
