#!/usr/bin/env node

const fs = require('fs');
const argv = require('minimist')(process.argv.slice(2));
const SwaggerParser = require('swagger-parser');

const generatePropTypes = require('./src/schemaToPropTypes');


if (argv._.length !== 2) {
	console.error("Wrong number of arguments");
	process.exit(1)
}

const src = argv._[0];
const target = argv._[1];

const content = fs.readFileSync(src);
const schema = JSON.parse(content);

const generatePropTypesFile = content => schema => {
	console.log("API name: %s, Version: %s", schema.info.title, schema.info.version);
	const fileContent = generatePropTypes(JSON.parse(content));

	fs.writeFile(`${target}`, fileContent, err => {
		return err ? console.log(err) : console.log(`${target} created`);
	});
};

SwaggerParser.validate(schema)
	.then(generatePropTypesFile(content))
	.catch((err) => console.error(err));
