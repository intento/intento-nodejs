'use strict'

const IntentoConnector = require('intento-nodejs')
const apikey = process.env.INTENTO_API_KEY
const client = new IntentoConnector({ apikey })

module.exports = client
