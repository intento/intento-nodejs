# Bash examples

Supposed to be run from folder with the `index.js` script. Also requires credentials to be set in `.env` file (see `.env.example` next to `index.js`)

Then run

```sh
# make sure that you run it from the folder containing index.js script
bash examples/simple.sh
```

Expected output

```sh
A simple example for translating a string to Spanish
API response:
 {
    "results": [
        "Durante la simulación, los genotipos inducen patrones de actividades del subsistema"
    ],
    "meta": {
        "detected_source_language": [
            "en"
        ]
    },
    "service": {
        "provider": {
            "id": "ai.text.translate.deepl.api",
            "name": "DeepL API"
        }
    }
}
```
