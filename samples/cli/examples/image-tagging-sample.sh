#!/usr/bin/env bash

export $(cat .env)

image=lemon.png


# is ok
# provider=ai.image.tagging.amazon.recognition_detect_labels_api
provider=ai.image.tagging.microsoft.computer_vision_api.2-0


echo "A simple example for tagging an image"
node index.js --key=$INTENTO_API_KEY \
    --intent=ai.image.tagging \
    --provider=$provider \
    --image_file=$image
