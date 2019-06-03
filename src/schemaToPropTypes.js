let indentLevel = 1;
const COMPONENT_NAME_SUFFIX = 'PropTypes';
const INDENT_CHAR = '\t';
const QUOTE_CHAR = "'";

/**
 * Formats the component name based on React standards and a suffix to avoid name collisions.
 * @param {String} name - The key string from the schema.
 * @returns {string}
 */
const formatComponentName = name =>
	`${name.charAt(0).toUpperCase()}${name.slice(1)}${COMPONENT_NAME_SUFFIX}`;

/**
 * Generates the required amount of indentation.
 * @param {Number} indentation - The amount of indentation.
 * @returns {string} - A string with indents
 */
const getIndentation = (indentation = indentLevel) =>
	indentation && typeof indentation === 'number'
		? INDENT_CHAR.repeat(Math.trunc(indentLevel))
		: '';

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
 * @returns {string}
 */
const getPropTypeValue = (propertyName, property) => {
	let propType = ``;

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
			if (property.$ref) {
				propType = getPropTypeValue(propertyName, { type: 'object', ...property });
			}
			break;
	}

	return `PropsTypes.${propType}`;
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
	const propertyKey = !/[^a-z]/i.test(name) ? `${name}` : `${QUOTE_CHAR}${name}${QUOTE_CHAR}`;

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
	const propType = propTypeStringIndented([
		propertyName,
		properties[propertyName],
		requiredProps,
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
	const requiredProps = 'required' in schema && schema.required;
	const propTypeStringIndented = useIndentation(propTypeString);
	const reducer = propertiesReducer(schema.properties, requiredProps);

	return schema.type === 'object'
		? Object.keys(schema.properties).reduce(reducer, '')
		: propTypeStringIndented([schemaName, schema, requiredProps]);
};

/**
 * Curry Reducer to stack the strings of several PropTypes. It passes the needed information in the reducer context.
 * @param {Object} schemas - The `schemas` object parsed from the openAPI file.
 * @returns {function(str: String, schemaName: String): String} - Adds up all the strings from every PropType.
 */
const schemasReducer = schemas => (str, schemaName) => {
	const schema = schemas[schemaName];
	const componentName = formatComponentName(schemaName);
	return `${str}export const ${componentName} = {\n${getPropTypes(schemaName, schema)}};\n\n`;
};

/**
 * Entry point to generate the `PropTypes`.
 * @param {Object} api - The parsed openAPI file.
 * @returns {String|Error} - The string with the whole `PropTypes` generated or an Error if it is a malformed file.
 */
const generatePropTypes = api => {
	const str = `import PropTypes from 'prop-types';\n\n`;
	const hasSchemas = api && 'components' in api && 'schemas' in api.components;
	const schemas = hasSchemas && api.components.schemas;

	return hasSchemas
		? Object.keys(schemas).reduce(schemasReducer(schemas), str)
		: new Error('API error: Missing schemas');
};

module.exports = generatePropTypes;
