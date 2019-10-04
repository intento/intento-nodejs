# Command Line Interface for Intento API

## TL;DR

A simple [example](examples/own-keys-auth.sh) for translating a string to russian

```sh
node index.js --key=$INTENTO_API_KEY \
    --to=ru \
    "During simulation, genotypes induce patterns of subsystem activities"
```

This instruction sends a request to Intento API. If no `--intent` specified, translation intent is used.
Get more information about other intents in [our docs](https://github.com/intento/intento-api#basic-usage)

<!-- TOC depthFrom:2 -->

- [TL;DR](#tldr)
- [Start using CLI](#start-using-cli)
    - [Update](#update)
- [Examples](#examples)
    - [List available providers](#list-available-providers)
    - [Filter providers by capabilities](#filter-providers-by-capabilities)
    - [Specify a provider](#specify-a-provider)
    - [Multiple providers and async mode](#multiple-providers-and-async-mode)
    - [Translate a file](#translate-a-file)
    - [Translate a file, write results to another file](#translate-a-file-write-results-to-another-file)
    - [Translate a large file, write results to another file](#translate-a-large-file-write-results-to-another-file)
    - [Async requests, advanced examples](#async-requests-advanced-examples)
        - [More attempts](#more-attempts)
        - [Postpone getting async results](#postpone-getting-async-results)
    - [Specifying input format](#specifying-input-format)
    - [Content processing](#content-processing)
    - [Bulk mode](#bulk-mode)
    - [Use own keys](#use-own-keys)
    - [Use custom or domain-specific models](#use-custom-or-domain-specific-models)
- [Error messages](#error-messages)
    - [Error: Invalid authentication credentials](#error-invalid-authentication-credentials)
    - [Error from provider: [bad_data] Model URL was not found](#error-from-provider-bad_data-model-url-was-not-found)
    - [Error from provider: [access] Request had invalid authentication credentials](#error-from-provider-access-request-had-invalid-authentication-credentials)

<!-- /TOC -->

## Start using CLI

Fastest way to start experimenting is following:

```sh
git clone git@github.com:intento/intento-nodejs.git
cd intento-nodejs/samples/cli
yarn install # or `npm install`
node index.js --key=$INTENTO_API_KEY \
    --to=ru \
    "sample text"
```

Make sure your node version [supports es6+ syntax](https://node.green/#ES2017-features-async-functions) and `util.promisify` for fs.readFile and fs.writeFile. node@^8.0.0 will suffice.

### Update

```sh
cd intento-nodejs/samples/cli
git pull
```

## Examples

Several examples are provided as bash scripts. Check out [./examples](./examples) folder.

### List available providers

```sh
node index.js --key=$INTENTO_API_KEY \
    --intent=translate.providers
```

Response may look like this

```sh
API response:
ai.text.translate.microsoft.translator_text_api.3-0
ai.text.translate.deepl.api
ai.text.translate.amazon.translate
ai.text.translate.baidu.translate_api
ai.text.translate.ibm-language-translator-nmt
ai.text.translate.google.translate_api.2-0
ai.text.translate.yandex.translate_api.1-5
```

Try to get available providers for the `sentiment` intent:

```sh
node index.js --key=$INTENTO_API_KEY \
    --intent=sentiment.providers
```

### Filter providers by capabilities

List translation providers able to translate from Russian (`--from=ru`) and supporting bulk mode (`--bulk`)

```sh
node index.js --key=$INTENTO_API_KEY \
    --intent=translate.providers \
    --from=ru \
    --bulk
```

[More on bulk mode](https://github.com/intento/intento-nodejs/blob/master/ai.text.translate.md#bulk-mode)

### Specify a provider

By default a provider for the job is smart-seleted. Find out more about it in the [docs](https://github.com/intento/intento-api#smart-routing).
In the same time a provider can be specified explicitly:

```sh
node index.js --key=$INTENTO_API_KEY \
    --intent=translate \
    --to=fr \
    --provider=ai.text.translate.microsoft.translator_text_api.3-0 \
    "During simulation, genotypes induce patterns of subsystem activities"
```

Check out an example with several providers specified in the next section.

### Multiple providers and async mode

More on async mode in the [docs](https://github.com/intento/intento-api#async-mode)

```sh
node index.js --key=$INTENTO_API_KEY \
    --intent=translate \
    --from=en \
    --to=fr \
    --provider=ai.text.translate.microsoft.translator_text_api.3-0,ai.text.translate.google.translate_api.2-0 \
    --async \
    "During simulation, genotypes induce patterns of subsystem activities"
```

Notice a `--from` parameter. In this case (with `--async=true`) it is required.

### Translate a file

```sh
node index.js --key=$INTENTO_API_KEY \
    --to=fr \
    --input=sample.txt
```

This command 1) will guess `from` language 2) will smart-select a provider 3) will write response to your console

Example response:

```sh
API response:
 {
    "results": [
        "...translated text from sample.txt..."
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

If `sample.txt`is too big, you'll see an error from that smart-selected provider.
Example error response:

```sh
Error: 413 Capabilities mismatch for the chosen provider (too long text, unsupported languages, etc)
Provider ai.text.translate.yandex.translate_api.1-5 constraint(s) violated: Constraint violated for parameter text: max-item-length=10000, passed value length=33546
Consider using --async option
```

### Translate a file, write results to another file

```sh
node index.js --key=$INTENTO_API_KEY \
    --to=fr \
    --input=sample.txt \
    --output=sample_results.txt
```

This command 1) will guess `from` language 2) will smart-select a provider 3) will write response to a file.

Example output:

```sh
Results were written to the ssample_results_smart.selected.provider.txt file
```

If `sample.txt`is too big, you'll see an error from that smart-selected provider.
Example error response:

```sh
Error: 413 Capabilities mismatch for the chosen provider (too long text, unsupported languages, etc)
Provider ai.text.translate.deepl.api constraint(s) violated: Constraint violated for maximum request length: max-request-length=30000, passed value length=35250
Consider using --async option
```

### Translate a large file, write results to another file

```sh
node index.js --key=$INTENTO_API_KEY \
    --to=fr \
    --async \
    --input=large_sample.txt \
    --output=large_sample_results.txt
```

Example output:

```sh
Smart mode for async operations currently isn't supported
Please specify a provider with `--provider` option.
To get available providers try an example https://github.com/intento/intento-nodejs/tree/master/samples/cli#list-available-providers
```

Choose a provider (or several providers)

```sh
node index.js --key=$INTENTO_API_KEY \
    --to=fr \
    --async \
    --provider=ai.text.translate.google.translate_api.2-0 \
    --input=large_sample.txt \
    --output=large_sample_results.txt
```

Example output:

```sh
Error: 413 Capabilities mismatch for the chosen provider (too long text, unsupported languages, etc)
Parameter 'from' is required when using async mode
```

Just add `--from=en` assuming large_sample.txt is in English

```sh
node index.js --key=$INTENTO_API_KEY \
    --from=en \
    --to=fr \
    --async \
    --provider=ai.text.translate.google.translate_api.2-0 \
    --input=large_sample.txt \
    --output=large_sample_results.txt
```

This command will asyncronously schedule a translatation job to be done. And after that it requests for that job results with another requests. The progress will be visualized in a console like that:

```sh
.                   1/15 7%
[skip lines]
...............     12/15 83%
..................  15/15 100%
```

If your job finishes during that time the output will be:

```sh
...............  15/15 100%
Results were written to the examples/large_sample_results.txt file
```

### Async requests, advanced examples

Continue with the same example from the previous section.

#### More attempts

If, say, the file is too big, it may take more time to finish the translation (or another job). And you'll see:

```sh
Stop sending operation requests

Operation some-unique-operation-id is still in progress
Request operation results later with a command
    node index.js --key=$INTENTO_API_KEY --intent=operations --id=some-unique-operation-id --output=large_sample_results.txt
```

By default up to 15 attempts are made to get async request results. One can use `--attempts` options to change that.
And by default there are 1000 milliseconds (1 second) between those requests. Use `--timedelta` options to change it.

Lets make fewer attempts, and let's make them less often

```sh
node index.js --key=$INTENTO_API_KEY \
    --from=en \
    --to=fr \
    --async \
    --attempts=8 \
    --timedelta=2500 \
    --provider=ai.text.translate.google.translate_api.2-0 \
    --input=large_sample.txt \
    --output=large_sample_results.txt
```

Results may lool like:

```sh
.......   7/8 88%

Results were written to the examples/large_sample_results.txt file
```

#### Postpone getting async results

Requesting async job with `--only_operation_id` flag will return you only job id

```sh
node index.js --key=$INTENTO_API_KEY \
    --from=en \
    --to=fr \
    --async \
    --only_operation_id \
    --provider=ai.text.translate.google.translate_api.2-0 \
    --input=large_sample.txt \
    --output=large_sample_results.txt
```

Example output:

```sh
operation id unique-operation-id-number

Request operation results later with a command
    node index.js --key=ada4cfb262d74dbf8d7938cfacf3a8a3 --intent=operations --id=unique-operation-id-number --output=large_sample_results.txt

Operation id was written to the large_sample_operation_id.txt file
```

It may be usefull when one doesn't need immediate results.
Wait for a while and run that command:

```sh
node index.js --key=$INTENTO_API_KEY \
    --intent=operations \
    --id=unique-operation-id-number \
    --output=large_sample_results.txt
```

Example output:

```sh
Results were written to the large_sample_ai.text.translate.google.translate_api.2-0.txt file
```

### Specifying input format

```sh
node index.js --key=$INTENTO_API_KEY \
    --intent=translate \
    --to=de \
    --provider=ai.text.translate.google.translate_api.2-0 \
    --format=html \
    "<p>A sample <b>text</b></p>"
```

Example output (compare with results without `--format`):

```sh
API response:
 {
    "results": [
        "<p> Ein <b>Beispieltext</b> </p>"
    ],
    ...
}
```

### Content processing

Sometimes it's more convenient to preprocess or postprocess text after translation, e.g. eliminate spaces before punctuation. You can easily delegate it to Intento API with `processing` tag. This tag includes a set of rules.

```sh
node index.js --key=$INTENTO_API_KEY \
    --intent=translate \
    --to=fr \
    --provider=ai.text.translate.microsoft.translator_text_api.2-0 \
    --post_processing=punctuation_set \
    " Sample text  ..   "
```

Example output (notice trimmed spaces):

```sh
API response:
 {
    "results": [
        "Exemple de texte..."
    ],
    ...
}
```

More information about sets and rules can be found at `https://api.inten.to/settings/processing-rules`. Each rule has a clear `description` what exactly it does. Run [examples/content-processing-rules.sh] to get current information on available processing rules.

### Bulk mode

We provide a bulk fulfillment mode to translate large multiline segments at once.

```sh
node index.js --key=$INTENTO_API_KEY \
    --bulk \
    --to=es \
    """During simulation
genotypes induce patterns of subsystem activities
"""
```

Example response:

```sh
 {
    "results": [
        "Durante la simulación",
        "los genotipos inducen patrones de actividades del subsistema",
        ""
    ],
    ...
}
```

When `--bulk` option is specified the given text is splitted into lines. It is useful when dealing with very large pieces of text.
It is more convinient to pass that piece of text as a file. Also `async` option is very helpful.

```sh
node index.js --key=$INTENTO_API_KEY \
    --async \
    --bulk \
    --from=ru \
    --to=es \
    --provider=ai.text.translate.promt.cloud_api.1-0 \
    --input=examples/war_and_peace.txt
```

### Use own keys

Translate with own google key (see an [example](./examples/own-keys-auth.sh))

```sh
node index.js --key=$INTENTO_API_KEY \
    --to=es \
    --provider=ai.text.translate.google.translate_api.2-0 \
    --auth="{\"key\": \"$YOUR_GOOGLE_APIKEY\" }" \
    "Hallo welt"
```

Translate with own IBM credentials

```sh
node index.js --key=$INTENTO_API_KEY \
    --to=es \
    --provider=ai.text.translate.ibm-language-translator \
    --auth="{\"user\": \"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxx\", \"password\": \"xxxxxxxx\" }" \
    "Hallo welt"
```

Or read own keys from a file:

```sh
node index.js --key=$INTENTO_API_KEY \
    --to=es \
    --provider=ai.text.translate.ibm-language-translator \
    --auth_file=path/to/file_with_own_keys.json \
    "Hallo welt"
```

### Use custom or domain-specific models

If one knows a model identifier, one can specify it in the `category` option:

```sh
node index.js --key=$INTENTO_API_KEY \
    --to=es \
    --provider=ai.text.translate.microsoft.translator_text_api.2-0 \
    --category=speech \
    "Hallo welt"
```

Translate with your own custom model.

```sh
node index.js --key=$INTENTO_API_KEY \
    --from=en \
    --to=pt \
    --provider=ai.text.translate.microsoft.translator_text_api.2-0 \
    --category=$MS_CUSTOM_MODEL_NAME \
    --auth="{\"key\": \"$YOUR_MICROSOFT_APIKEY\" }" \
    "Genetics and epigenetics are important for this"
```

Translate a big file with your own custom model (requires custom keys).

```sh
node index.js --key=$INTENTO_API_KEY \
    --async \
    --bulk \
    --from=ru \
    --to=es \
    --provider=ai.text.translate.microsoft.translator_text_api.2-0 \
    --category=$MS_CUSTOM_MODEL_NAME \
    --auth="{\"key\": \"$YOUR_MICROSOFT_APIKEY\" }" \
    --input=war-and-peace.txt \
    --output=war-and-peace-es.txt
```

These examples in [a script](./examples/translate-with-custom-model.sh).

## Error messages

### Error: Invalid authentication credentials

```sh
node index.js --key=some_invalid_key \
    --intent=translate \
    --provider=ai.text.translate.google.translate_api.v3beta1 \
    --from=en \
    --to=pt \
    "epigenetics markers for cancer and bowel syndrome treatment in a hospital setting"
```

### Error from provider: [bad_data] Model URL was not found

Because this provider requires `category` (custom model)

```sh
node index.js --key=$INTENTO_API_KEY \
    --intent=translate \
    --provider=ai.text.translate.google.translate_api.v3beta1 \
    --from=en \
    --to=pt \
    "epigenetics markers for cancer and bowel syndrome treatment in a hospital setting"
```

### Error from provider: [access] Request had invalid authentication credentials

`Error from provider: [access] Request had invalid authentication credentials. Expected OAuth 2 access token.`

Because this provider requires credentials to use your custom model.

```sh
node index.js --key=$INTENTO_API_KEY \
    --intent=translate \
    --provider=ai.text.translate.google.translate_api.v3beta1 \
    --category=YOUR_CUSTOM_CATEGORY \
    --from=en \
    --to=pt \
    "epigenetics markers for cancer and bowel syndrome treatment in a hospital setting"
```
