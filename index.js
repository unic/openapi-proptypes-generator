#!/usr/bin/env node

const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));
const SwaggerParser = require('swagger-parser');

const generatePropTypes = require('./src/schemaToPropTypes');

if (argv._.length !== 2) {
	// eslint-disable-next-line no-console
	console.error('Wrong number of arguments');
	process.exit(1);
}

const src = argv._[0];
const target = argv._[1];

const content = fs.readFileSync(src);
const schema = JSON.parse(content);

const generatePropTypesFile = fileContent => parsedSchema => {
	// eslint-disable-next-line no-console
	console.log('API name: %s, Version: %s', parsedSchema.info.title, parsedSchema.info.version);
	const parsedFileContent = generatePropTypes(JSON.parse(fileContent));

	fs.writeFile(`${target}`, parsedFileContent, err => {
		// eslint-disable-next-line no-console
		return err ? console.log(err) : console.log(`${target} created`);
	});
};

SwaggerParser.validate(schema)
	.then(generatePropTypesFile(content))
	// eslint-disable-next-line no-console
	.catch(err => console.error(err));
