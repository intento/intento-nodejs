# Command Line Interface for Intento API

## TL;DR

A simple example for translating a string to russian

```sh
node index.js --key=INTENTO_API_KEY \
    --to=ru \
    "During simulation, genotypes induce patterns of subsystem activities"
```

This instruction sends a request to Intento API. If no `--intent` specified, translation intent is used.
Get more information about other intents in [our docs](https://intento.github.io/intento-api/#basic-usage)

## Start using CLI

Fastest way to start experimenting is following:

```sh
git clone git@github.com:intento/intento-nodejs.git
cd intento-nodejs/samples/cli
yarn install # or `npm install`
node index.js --key=INTENTO_API_KEY \
    --to=ru \
    "sample text"
```

## Examples

### List available providers

```sh
node index.js --key=INTENTO_API_KEY \
    --intent=translate.providers
```

Response may look like this

```sh
API response:
ai.text.translate.systran.pnmt
ai.text.translate.microsoft.translator_text_api.3-0
ai.text.translate.sdl.language_cloud_translation_toolkit
ai.text.translate.deepl.api
ai.text.translate.amazon.translate
ai.text.translate.baidu.translate_api
ai.text.translate.ibm-language-translator-nmt
ai.text.translate.google.translate_api.2-0
ai.text.translate.yandex.translate_api.1-5
```

Try to get available providers for the `sentiment` intent:

```sh
node index.js --key=INTENTO_API_KEY \
    --intent=sentiment.providers
```

### Specify a provider

By default a provider for the job is smart-seleted. Find out more about it in the [docs](https://intento.github.io/intento-api/#smart-routing).
In the same time a provider can be specified explicitly:

```sh
node index.js --key=INTENTO_API_KEY \
    --intent=translate \
    --to=fr \
    --provider=ai.text.translate.microsoft.translator_text_api.3-0 \
    "During simulation, genotypes induce patterns of subsystem activities"
```

Check out an example with several providers specified in the next section.

### Multiple providers and async mode

More on async mode in the [docs](https://intento.github.io/intento-api/#async-mode)

```sh
node index.js --key=INTENTO_API_KEY \
    --intent=translate \
    --from=en \
    --to=fr \
    --provider=ai.text.translate.microsoft.translator_text_api.3-0,ai.text.translate.google.translate_api.2-0 \
    --async \
    "During simulation, genotypes induce patterns of subsystem activities"
```

Notice a `--from` parameter. In this case (with `--async true`) it is required.

### Error messages

#### Error: Invalid authentication credentials

```sh
node index.js --key=some_invalid_key \
    --intent=translate \
    --provider=ai.text.translate.google.automl_api.v1alpha1 \
    --from=en \
    --to=pt \
    "epigenetics markers for cancer and bowel syndrome treatment in a hospital setting"
```

#### Error from provider: [bad_data] Model URL was not found

Because this provider requires `category` (custom model)

```sh
node index.js --key=INTENTO_API_KEY \
    --intent=translate \
    --provider=ai.text.translate.google.automl_api.v1alpha1 \
    --from=en \
    --to=pt \
    "epigenetics markers for cancer and bowel syndrome treatment in a hospital setting"
```

#### Error from provider: [access] Request had invalid authentication credentials

`Error from provider: [access] Request had invalid authentication credentials. Expected OAuth 2 access token.`

Because this provider requires credentials to use your custom model.

```sh
node index.js --key=INTENTO_API_KEY \
    --intent=translate \
    --provider=ai.text.translate.google.automl_api.v1alpha1 \
    --category=YOUR_CUSTOM_CATEGORY \
    --from=en \
    --to=pt \
    "epigenetics markers for cancer and bowel syndrome treatment in a hospital setting"
```
