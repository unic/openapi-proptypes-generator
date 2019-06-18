#!/usr/bin/env node

const fs = require('fs');
const yaml = require('js-yaml');
const argv = require('minimist')(process.argv.slice(2));
const SwaggerParser = require('swagger-parser');

const generatePropTypes = require('./src/schemaToPropTypes');

const isJson = file => file.indexOf('.json') > -1;

if (argv._.length !== 2 && argv._.length !== 3) {
	// eslint-disable-next-line no-console
	console.error('Wrong number of arguments');
	process.exit(1);
}

const src = argv._[0];
const target = argv._[1];
const schemaToParse = argv._[2];

const content = fs.readFileSync(src);
const schema = isJson(src) ? JSON.parse(content) : yaml.safeLoad(content);

const generatePropTypesFile = fileContent => parsedSchema => {
	// eslint-disable-next-line no-console
	console.log('API name: %s, Version: %s', parsedSchema.info.title, parsedSchema.info.version);
	const parsedFileContent = isJson(src) ? JSON.parse(fileContent) : yaml.safeLoad(fileContent);
	const generatedPropTypes = generatePropTypes(parsedFileContent, schemaToParse);

	fs.writeFile(`${target}`, generatedPropTypes, err => {
		// eslint-disable-next-line no-console
		return err ? console.log(err) : console.log(`${target} created`);
	});
};

SwaggerParser.validate(schema)
	.then(generatePropTypesFile(content))
	// eslint-disable-next-line no-console
	.catch(err => console.error(err));
