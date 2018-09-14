#!/usr/bin/env bash

export $(cat .env)

provider=ai.text.translate.microsoft.translator_text_api.3-0
# provider=ai.text.translate.sdl.language_cloud_translation_toolkit
# provider=ai.text.translate.promt.cloud_api.1-0
# provider=ai.text.translate.amazon.translate
# provider=ai.text.translate.baidu.translate_api
# provider=ai.text.translate.ibm-language-translator-v3
# provider=ai.text.translate.yandex.translate_api.1-5
# provider=ai.text.translate.google.translate_api.2-0
# provider=ai.text.translate.systran.translation_api.1-0-0
# provider=ai.text.translate.modernmt.enterprise
# auth_file=examples/modernmt_own_keys.json


echo "Translate with selected provider"

node index.js \
    --async \
    --bulk \
    --from=pt \
    --to=en \
    --provider=$provider \
    --input=/Users/path/to/file-to-translate.txt \
    --output="/Users/path/to/translated/file/${provider}_pt_en.txt"
echo
