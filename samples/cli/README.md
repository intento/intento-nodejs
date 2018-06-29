# Command Line Interface for Intento API

## TL;DR

A simple example for translating a string to russian

```sh
node index.js -k YOUR_API_KEY \
    -i translate \
    --to='ru' \
    "During simulation, genotypes induce patterns of subsystem activities"
```

### Specify provider

```sh
node index.js -k YOUR_API_KEY \
    -i translate \
    --to='fr' \
    --provider=ai.text.translate.microsoft.translator_text_api.3-0 \
    "During simulation, genotypes induce patterns of subsystem activities"
```

### Multiple providers and async mode

```sh
node index.js -k YOUR_API_KEY \
    -i translate \
    --from 'en' \
    --to 'fr' \
    --provider ai.text.translate.microsoft.translator_text_api.3-0,ai.text.translate.google.translate_api.2-0 \
    --async \
    "During simulation, genotypes induce patterns of subsystem activities"
```

### Error: Invalid authentication credentials

```sh
node index.js -k some_invalid_key \
    -i translate \
    --provider=ai.text.translate.google.automl_api.v1alpha1 \
    --from=en \
    --to=pt \
    "epigenetics markers for cancer and bowel syndrome treatment in a hospital setting"
```

### Error from provider: [bad_data] Model URL was not found

Because this provider requires `category` (custom model)

```sh
node index.js -k YOUR_API_KEY \
    -i translate \
    --provider=ai.text.translate.google.automl_api.v1alpha1 \
    --from=en \
    --to=pt \
    "epigenetics markers for cancer and bowel syndrome treatment in a hospital setting"
```

### Error from provider: [access] Request had invalid authentication credentials

`Error from provider: [access] Request had invalid authentication credentials. Expected OAuth 2 access token.`

Because this provider requires credentials to use your custom model.

```sh
node index.js -k YOUR_API_KEY \
    -i translate \
    --provider=ai.text.translate.google.automl_api.v1alpha1 \
    --category="YOUR_CUSTOM_CATEGORY"
    --from=en \
    --to=pt \
    "epigenetics markers for cancer and bowel syndrome treatment in a hospital setting"
```