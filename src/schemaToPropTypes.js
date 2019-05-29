let INDENT_LEVEL = 1;
const COMPONENT_NAME_SUFFIX = 'PropTypes';
const INDENT_CHAR = '\t';

const generatePropTypes = (api) => {
	const str = `import PropTypes from 'prop-types';\n\n`;
	const hasSchemas = api && 'components' in api && 'schemas' in api.components;
	const schemas = hasSchemas && api.components.schemas;

	return hasSchemas
		? Object.keys(schemas).reduce(schemasReducer(schemas), str)
		: new Error('API error: Missing schemas');
};

const schemasReducer = schemas => (str, schemaName) => {
	const schema = schemas[schemaName];
	const componentName = formatComponentName(schemaName);
	return `${str}export const ${componentName} = {\n${ getPropTypes(schemaName, schema) }};\n\n`;
};

const formatComponentName = name => `${name.charAt(0).toUpperCase()}${name.slice(1)}${COMPONENT_NAME_SUFFIX}`;

const getPropTypes = (schemaName, schema) => {
	const requiredProps = ('required' in schema && schema.required);
	const propTypeStringIndented = _indentDecorator(propTypeString);

	return schema.type === 'object'
		? Object.keys(schema.properties).reduce(propertiesReducer(schema.properties, requiredProps), '')
		: propTypeStringIndented([schemaName, schema, requiredProps]);
};

const propertiesReducer = (properties, requiredProps) => (str, propertyName) => {
	const propTypeStringIndented = _indentDecorator(propTypeString);
	const propType = propTypeStringIndented([propertyName, properties[propertyName], requiredProps]);

	return `${str}${propType}`;
};

const propTypeString = (schemaName, schema, requiredProps) => {
	let str = '';
	// Add quotes to property name when it contains non-words chars
	const propertyKey = !(/[^a-z]/i).test(schemaName) ? `${schemaName}` : `'${schemaName}'`;

	str += `${propertyKey}: ${getPropTypeValue(schemaName, schema)}`;
	str += `${getRequired(schemaName, schema, requiredProps)}\n`;

	return str;
};

const getPropTypeValue = (propertyName, property) => {
	let str = 'PropTypes.';

	switch(property.type) {
		case 'array':
			if (property.items.$ref) {
				const extractRefProp = formatComponentName(getRef(property.items.$ref));
				str += `arrayOf(${extractRefProp})`
			} else {
				str += `arrayOf(${ getPropTypeValue(propertyName, property.items) })`;
			}
			break;

		case 'object':
			if (property.$ref) {
				str += `shape(${ getRef(property.$ref) })`;
			} else {
				INDENT_LEVEL += 1;
				str += `shape({\n${ getPropTypes(propertyName, property) }${ getIndentation(INDENT_LEVEL-1) }})`;
				INDENT_LEVEL -= 1;
			}
			break;

		case 'number':
		case 'integer':
		case 'long':
		case 'float':
		case 'double':
			str += 'number';
			break;

		case 'string':
		case 'byte':
		case 'binary':
		case 'date':
		case 'DATETIME':
		case 'password':
			str += 'string';
			break;

		case 'boolean':
			str += 'bool';
			break;

		default:
			if (property.$ref) {
				str += getPropTypeValue(propertyName, { type: 'object', ...property });
			}
			break;
	}

	return str;
};

const _indentDecorator = (func, prefix = true) => args => {
	const indents = getIndentation();

	return `${prefix ? indents : ''}${func.apply(this, args)}${prefix ? '' : indents}`;
};

const getIndentation = (indentLevel = INDENT_LEVEL) => indentLevel && typeof indentLevel === 'number'
	? [...Array(Math.trunc(indentLevel))].map(() => `${INDENT_CHAR}`).join('')
	: '';

const getRequired = (propName, property, requiredProps = []) => (
	Array.isArray(requiredProps) && (requiredProps.indexOf(propName) > -1 || property.required)
		? '.isRequired,'
		: ','
);

const getRef = (ref) => ref.split('/').pop();

module.exports = generatePropTypes;
