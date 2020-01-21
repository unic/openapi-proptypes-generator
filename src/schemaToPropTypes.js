let indentLevel = 1;
const ESLINT_OVERWRITES = `/* eslint no-use-before-define: 0 */\n`;
const FILE_IMPORTS = `import PropTypes from 'prop-types';\n`;
const COMPONENT_NAME_SUFFIX = 'PropTypes';
const INDENT_CHAR = '\t';
const QUOTE_CHAR = "'";
let schemas;

/**
 * Formats the component name based on React standards and a suffix to avoid name collisions.
 * @param {String} name - The key string from the schema.
 * @returns {string}
 */
const formatComponentName = name => {
	const safeName = name.replace(new RegExp(':', 'g'), '');

	return `${safeName.charAt(0).toUpperCase()}${safeName.slice(1)}${COMPONENT_NAME_SUFFIX}`;
};

/**
 * Generates the required amount of indentation.
 * @param {Number} indentation - The amount of indentation.
 * @returns {string} - A string with indents
 */
const getIndentation = (indentation = indentLevel) =>
	indentation && typeof indentation === 'number' ? INDENT_CHAR.repeat(Math.trunc(indentLevel)) : '';

/**
 * Decorator to add indentation to the strings output from any needed functions.
 * @param {Function} func - The function returning a string whose return needs to be decorated.
 * @param {Boolean} prefix - Whether should add prefix.
 * @param {Boolean} suffix - Whether should add suffix. Negation to prefix is default.
 * @returns {function(args: Array): string} - The decorated String
 * @private
 */
const useIndentation = (func, prefix = true, suffix = !prefix) => args => {
	const indents = getIndentation();

	return `${prefix ? indents : ''}${func.apply(this, args)}${suffix ? indents : ''}`;
};

/**
 * Adds the `Required` string given a property and an array of required properties.
 * @param {String} propName - The name of the property to be checked.
 * @param {Object} property - The property itself (is property.required a valid openAPI format?).
 * @param {Array} requiredProps - The array of required properties in a schema.
 * @param {Boolean} commaSuffix - Whether should append a comma un the end.
 * @returns {string}
 */
const getRequired = (propName, property, requiredProps = [], commaSuffix) => {
	let requiredStr =
		Array.isArray(requiredProps) && (requiredProps.indexOf(propName) > -1 || property.required)
			? '.isRequired'
			: '';

	if (commaSuffix) {
		requiredStr += ',';
	}

	return requiredStr;
};

/**
 * Returns the name of the reference.
 * @param {String} ref - The `$ref` string.
 * @returns {string} - The name of the reference in the `$ref`
 */
const getRef = ref => ref.split('/').pop();

/**
 * Creates the string for the value of a property.
 * @param {String} propertyName - The key (name) of the property.
 * @param {Object} property - The property to generate the value from.
 * @param {Boolean} prefixReturn - Add Proptypes Prefix to return.
 * @returns {string}
 */
const getPropTypeValue = (propertyName, property, prefixReturn = true) => {
	let shouldPrefixReturn = prefixReturn;
	let propType = ``;

	if (typeof property.enum !== 'undefined') {
		const items = JSON.stringify(property.enum);
		propType += `oneOf(${items})`;
		return `${shouldPrefixReturn ? 'PropTypes.' : ''}${propType}`;
	}

	switch (property.type) {
		case 'array':
			if (property.items.$ref) {
				const extractRefProp = formatComponentName(getRef(property.items.$ref));
				propType += `arrayOf(PropTypes.shape(${extractRefProp}))`;
			} else {
				propType += `arrayOf(${getPropTypeValue(propertyName, property.items)})`;
			}
			break;

		case 'object':
			if (property.$ref) {
				propType += `shape(${formatComponentName(getRef(property.$ref))})`;
			} else {
				const indentation = getIndentation();
				indentLevel += 1;
				// eslint-disable-next-line no-use-before-define
				propType += `shape({\n${getPropTypes(propertyName, property)}${indentation}})`;
				indentLevel -= 1;
			}
			break;

		case 'number':
		case 'integer':
		case 'long':
		case 'float':
		case 'double':
			propType += 'number';
			break;

		case 'string':
		case 'byte':
		case 'binary':
		case 'date':
		case 'DATETIME':
		case 'password':
			propType += 'string';
			break;

		case 'boolean':
			propType += 'bool';
			break;

		default:
			// eslint-disable-next-line no-use-before-define
			propType += getPropTypeValueFromUntyped(propertyName, property, shouldPrefixReturn);
			shouldPrefixReturn = false;
			break;
	}

	return `${shouldPrefixReturn ? 'PropTypes.' : ''}${propType}`;
};

/**
 * Creates the string for the value of a untyped property.
 * @param {String} propertyName - The key (name) of the property.
 * @param {Object} property - The property to generate the value from.
 * @returns {string}
 */
const getPropTypeValueFromUntyped = (propertyName, property, prefixReturn) => {
	let shouldPrefixReturn = prefixReturn;
	let propType = ``;

	if (property.$ref) {
		const refPropertyName = property.$ref.split('/').reverse()[0];
		const refComponentName = formatComponentName(refPropertyName);
		const refDefinition = schemas[refPropertyName] || {};
		const isObjectRefDefinition = refDefinition.type === 'object';

		if (isObjectRefDefinition) {
			shouldPrefixReturn = true;
			propType = getPropTypeValue(propertyName, { type: 'object', ...property }, false);
		} else {
			shouldPrefixReturn = false;
			propType = refComponentName;
		}
	} else if (property.allOf) {
		shouldPrefixReturn = true;
		propType += 'arrayOf(';
		property.allOf.forEach(item => {
			const indentation = getIndentation();
			propType += `\n${indentation}${getPropTypeValue(propertyName, item)},`;
		});

		propType += `\n${indentLevel > 1 ? INDENT_CHAR : ''})`;
	}

	return `${shouldPrefixReturn ? 'PropTypes.' : ''}${propType}`;
};

/**
 * Generates the string for a given property.
 * @param {String} name - The key (name) of the property.
 * @param {Object} property - The property to generate the value from.
 * @param {Array} requiredProps - The array of required properties in a schema.
 * @param {Boolean} isObjectDefinition - Whether provided property is an object.
 * @returns {string}
 */
const propTypeString = (name, property, requiredProps, isObjectDefinition) => {
	let str = '';
	if (isObjectDefinition) {
		// Add quotes to property name when it contains non-words chars
		const propertyKey = /^[a-z]\w+$/i.test(name) ? `${name}` : `${QUOTE_CHAR}${name}${QUOTE_CHAR}`;

		str += `${propertyKey}: `;
	}

	str += `${getPropTypeValue(name, property)}`;
	str += `${getRequired(name, property, requiredProps, isObjectDefinition)}`;

	if (isObjectDefinition) {
		str += '\n';
	}

	return str;
};

/**
 * Curry reducer to stack the strings for each PropTypes. It passes the needed information in the reducer context.
 * @param {Object} properties - The properties object in a schema.
 * @param {Array} requiredProps - The array of required properties in a schema.
 * @param {Boolean} isObjectDefinition - Whether provided property is an object.
 * @returns {function(str: String, propertyName: String): string} - The `reduce` callback function, which gets the accumulator (`str`) and the current value (`propertyName`).
 */
const propertiesReducer = (properties, requiredProps, isObjectDefinition) => (
	str,
	propertyName,
) => {
	const propTypeStringIndented = useIndentation(propTypeString);
	const propType = propTypeStringIndented([
		propertyName,
		properties[propertyName],
		requiredProps,
		isObjectDefinition,
	]);

	return `${str}${propType}`;
};

/**
 * Generates the string for the PropTypes of a given schema.
 * @param {String} schemaName - The key (name) of the schema.
 * @param {Object} schema - The schema to generate PropTypes from.
 * @returns {string}
 */
const getPropTypes = (schemaName, schema) => {
	const isObjectDefinition = schema.type === 'object';
	const requiredProps = 'required' in schema && schema.required;
	const propTypeStringIndented = useIndentation(
		propTypeString,
		!!isObjectDefinition,
		!isObjectDefinition ? false : undefined,
	);
	const reducer = propertiesReducer(schema.properties, requiredProps, isObjectDefinition);

	return schema.type === 'object'
		? Object.keys(schema.properties).reduce(reducer, '')
		: propTypeStringIndented([schemaName, schema, requiredProps, isObjectDefinition]);
};

/**
 * Reducer to stack the strings of several PropTypes. It passes the needed information in the reducer context.
 * @param {String} str - The accumulator.
 * @param {String} schemaName - The key (name) of the schema.
 * @param {Object} schema - The schema to generate PropTypes from.
 * @returns {string} - Adds up all the strings from every PropType.
 */
const schemasReducer = (str, [schemaName, schema]) => {
	const componentName = formatComponentName(schemaName);
	const isObjectDefinition = schema.type === 'object';
	const propTypes = getPropTypes(schemaName, schema);

	if (isObjectDefinition) {
		return `${str}\nexport const ${componentName} = {\n${propTypes}};\n`;
	}

	return `${str}\nexport const ${componentName} = ${propTypes};\n`;
};

/**
 * Entry point to generate the `PropTypes`.
 * @param {Object} api - The parsed api (openApi or Swagger) file.
 * @param {String} schemaToParse - optional - specific schema to be parsed
 * @returns {String|Error} - The string with the whole `PropTypes` generated or an Error if it is a malformed file.
 */
const generatePropTypes = (api, schemaToParse) => {
	const initialString = `${ESLINT_OVERWRITES}${FILE_IMPORTS}`;

	let apiVersion;
	let hasSchemas;
	if (api && 'openapi' in api && parseFloat(api.openapi, 10) === 3) {
		apiVersion = 'openapi3';
		hasSchemas = 'components' in api && 'schemas' in api.components;
	} else if (api && 'swagger' in api && parseFloat(api.swagger, 10) === 2) {
		apiVersion = 'swagger2';
		hasSchemas = 'definitions' in api;
	}

	if (hasSchemas) {
		switch (apiVersion) {
			case 'swagger2':
				schemas =
					schemaToParse && api.components.definitions[schemaToParse]
						? api.components.definitions[schemaToParse].properties
						: api.definitions;
				break;
			case 'openapi3':
			default:
				schemas =
					schemaToParse && api.components.schemas[schemaToParse]
						? api.components.schemas[schemaToParse].properties
						: api.components.schemas;
				break;
		}
	}

	return hasSchemas
		? Object.entries(schemas).reduce(schemasReducer, initialString)
		: new Error('API error: Missing schemas');
};

module.exports = generatePropTypes;
