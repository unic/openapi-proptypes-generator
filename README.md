# openapi-proptypes-generator

Generate PropTypes from openAPI 3 JSON or YAML schemas

## Usage

From your terminal, provide a source file in openAPI 3 JSON(YAML) format and a destination file where you would like your generated prop-types to be saved:

```sh
index.js ./examples/openapi.json ./proptypes.js
```
or
```sh
index.js ./examples/openapi.yaml ./proptypes.js
```

Adding optional 3rd parameter - schemaToParse
```sh
index.js ./examples/openapi.yaml ./proptypes.js datamodels
```

will generate PropTypes only from given schema (if exists in source file, else it will generete all found schemas).

Alternatively you can also set an npm script in your `package.json`:

```json
{
  "scripts": {
    "generate": "index.js ./examples/openapi.json ./proptypes.js"
  }
}
```

Then you can call it from your shell:

```sh
npm run generate
```

## Further development

- Use the proper node version, in this repo via [NVM](https://github.com/nvm-sh/nvm): `nvm use` (Stick to LTS versions only)
- Install the project: `npm ci`

## Roadmap

- Pass options through CLI
- Add tests
- Going UMD?
- Move to a template(s) based system instead of a string generation?
