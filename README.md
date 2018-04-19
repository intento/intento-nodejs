# Intento nodejs

An adapter to query Intento Collective Intelligence API.

To get more information check out [the site](https://inten.to/).

[API User Manual](https://github.com/intento/intento-api)

In case you don't have a key to use Intento API, please feel free to mail hello@inten.to

## Installation

```bash
npm install intento-nodejs
```

or

```bash
yarn add intento-nodejs
```

## Example usage

### Using `data` argument from a curl request directly

For a `curl` instruction from [the docs](https://github.com/intento/intento-api)

```bash
curl -XPOST -H 'apikey: YOUR_API_KEY' 'https://api.inten.to/ai/text/translate' -d '{
    "context": {
        "text": "A sample text",
        "to": "es"
    },
    "service": {
        "provider": "ai.text.translate.microsoft.translator_text_api.2-0"
    }
}'
```

try following:

```js
const Intentor = require('intento-nodejs')

const api_key = process.env.INTENTO_API_KEY

const client = new Intentor({ api_key: api_key })

client.makeRequest({
    path: '/ai/text/translate',
    method: 'POST',
    data: `{
        "context": {
            "text": "A sample text",
            "to": "es"
        },
        "service": {
            "provider": "ai.text.translate.microsoft.translator_text_api.2-0"
        }
    }`,
    fn: (err, data) => {
        if (err) console.log('error:' + err.message)
        console.log(data)
    },
})
```

### Describe `data` dynamicly through `content`

For example we'd like to translate the same text for different languages.
One can make similar requests for each language like this:

```js
const Intentor = require('intento-nodejs')

const api_key = process.env.INTENTO_API_KEY

const client = new Intentor({ api_key: api_key })

const options = {
    path: '/ai/text/translate',
    method: 'POST',
    // content: ...
    fn: (err, data) => {
        if (err) console.log('error:' + err.message)
        console.log(data)
    },
}

['es', 'ru', 'da'].forEach(lang => {
    client.makeRequest({
        ...options, // path, method, callback fn
        content: {
            context: {
                text: 'A sample text',
                to: lang,
            },
        },
    })
})
```

So you can pass a plain javascript object as a `content` parameter.

### More

To get more examples:

```bash
git clone git@github.com:intento/intento-nodejs.git
cd intento-nodejs
INTENTO_API_KEY=YOUR_SECRET_KEY node example.js
```

Though for the latter you need to have `INTENTO_API_KEY` in your environment.

## How to pass your API keys to your environment

### zero option (dev only)

Hardcode your keys in the script your are experimenting with :)

### 1st option

For Unix-like machines run:

```bash
INTENTO_API_KEY=YOUR_SECRET_KEY GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY node example.js
```

For Windows machines run:

```bash
SET INTENTO_API_KEY=YOUR_SECRET_KEY GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY node example.js
```

### 2nd option

Assuming your are in `intento-nodejs` folder run:

```bash
cp .env.example .env
```

Then edit `.env`, **put your api keys there**.

Make that environmental variables available in the current context

```bash
export $(cat .env) # once per terminal
```

Run `example.js` script

```bash
node example.js
```

### 3rd option

Use your favorite "env" package like `dotenv` or `node-env-file`.
