# Examples to run from nodejs

```sh
yarn install
```

or

```sh
npm install
```

```sh
cp .env.examples .env
```

Edit credentials in `.env` file.

Run examples one by one to see the output:

```sh
export $(cat .env)
node ai.text.translate.js
node explore-providers.js
node ai.text.dictionary.js
node ai.text.sentiment.js
```
