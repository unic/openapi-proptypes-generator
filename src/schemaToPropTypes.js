let indentLevel = 1;
const ESLINT_OVERWRITES = `/* eslint no-use-before-define: 0 */\n`;
const FILE_IMPORTS = `import PropTypes from 'prop-types';\n`;
const COMPONENT_NAME_SUFFIX = 'PropTypes';
const INDENT_CHAR = '\t';
const QUOTE_CHAR = "'";

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
 * @param {Boolean} prefix - Whether the indentation should happen as a prefix or as a suffix. Prefix is default
 * @returns {function(args: Array): string} - The decorated String
 * @private
 */
const useIndentation = (func, prefix = true) => args => {
	const indents = getIndentation();

	return `${prefix ? indents : ''}${func.apply(this, args)}${prefix ? '' : indents}`;
};

/**
 * Adds the `Required` string given a property and an array of required properties.
 * @param {String} propName - The name of the property to be checked.
 * @param {Object} property - The property itself (is property.required a valid openAPI format?).
 * @param {Array} requiredProps - The array of required properties in a schema.
 * @returns {string}
 */
const getRequired = (propName, property, requiredProps = []) =>
	Array.isArray(requiredProps) && (requiredProps.indexOf(propName) > -1 || property.required)
		? '.isRequired,'
		: ',';

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
	let propType = ``;

	if (typeof property.enum !== 'undefined') {
		const items = JSON.stringify(property.enum);
		propType += `oneOf(${items})`;
		return `${prefixReturn ? 'PropTypes.' : ''}${propType}`;
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
			propType += getPropTypeValueFromUntyped(propertyName, property);
			break;
	}

	return `${prefixReturn ? 'PropTypes.' : ''}${propType}`;
};

/**
 * Creates the string for the value of a untyped property.
 * @param {String} propertyName - The key (name) of the property.
 * @param {Object} property - The property to generate the value from.
 * @returns {string}
 */
const getPropTypeValueFromUntyped = (propertyName, property) => {
	let propType = ``;

	if (property.$ref) {
		propType = getPropTypeValue(propertyName, { type: 'object', ...property }, false);
	} else if (property.allOf) {
		propType += 'arrayOf(';
		property.allOf.forEach(item => {
			indentLevel += 1;
			const indentation = getIndentation();
			propType += `\n${indentation}${getPropTypeValue(propertyName, item)},`;
			indentLevel -= 1;
		});
		propType += `\n${INDENT_CHAR})`;
	}

	return propType;
};

/**
 * Generates the string for a given property.
 * @param {String} name - The key (name) of the property.
 * @param {Object} property - The property to generate the value from.
 * @param {Array} requiredProps - The array of required properties in a schema.
 * @returns {string}
 */
const propTypeString = (name, property, requiredProps) => {
	let str = '';
	// Add quotes to property name when it contains non-words chars
	const propertyKey = /^[a-z]\w+$/i.test(name) ? `${name}` : `${QUOTE_CHAR}${name}${QUOTE_CHAR}`;

	str += `${propertyKey}: ${getPropTypeValue(name, property)}`;
	str += `${getRequired(name, property, requiredProps)}\n`;

	return str;
};

/**
 * Curry reducer to stack the strings for each PropTypes. It passes the needed information in the reducer context.
 * @param {Object} properties - The properties object in a schema.
 * @param {Array} requiredProps - The array of required properties in a schema.
 * @returns {function(str: String, propertyName: String): string} - The `reduce` callback function, which gets the accumulator (`str`) and the current value (`propertyName`).
 */
const propertiesReducer = (properties, requiredProps) => (str, propertyName) => {
	const propTypeStringIndented = useIndentation(propTypeString);
	const propType = propTypeStringIndented([propertyName, properties[propertyName], requiredProps]);

	return `${str}${propType}`;
};

/**
 * Generates the string for the PropTypes of a given schema.
 * @param {String} schemaName - The key (name) of the schema.
 * @param {Object} schema - The schema to generate PropTypes from.
 * @returns {string}
 */
const getPropTypes = (schemaName, schema) => {
	const requiredProps = 'required' in schema && schema.required;
	const propTypeStringIndented = useIndentation(propTypeString);
	const reducer = propertiesReducer(schema.properties, requiredProps);

	return schema.type === 'object'
		? Object.keys(schema.properties).reduce(reducer, '')
		: propTypeStringIndented([schemaName, schema, requiredProps]);
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
	return `${str}\nexport const ${componentName} = {\n${getPropTypes(schemaName, schema)}};\n`;
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

	let schemas;
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
