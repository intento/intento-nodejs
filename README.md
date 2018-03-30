# Intento nodejs

[API User Manual](https://github.com/intento/intento-api)

## How to

0. Install
```
npm install intento-nodejs
```

or
```
yarn add intento-nodejs
```

1. Get your intento api key from us :)

2. Then (1st option): 
    - run

    ```bash 
    INTENTO_API_KEY=YOUR_SECRET_KEY GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY node example.js
    ```

    - enjoy!

or

2. Then (2nd option)
    - run

        ```bash 
        cp .env.example .env
        ```

    - edit `.env`, put your api keys there
    - make that environmental variables available in the current context

        ```bash 
        export $(cat .env) # once per term
        ```

    - run `example.js` script

        ```bash 
        node example.js
        ```

    - enjoy!

