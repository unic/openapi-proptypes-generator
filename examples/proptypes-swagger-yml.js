/* eslint no-use-before-define: 0 */
import PropTypes from 'prop-types';

export const EnumDefinitionPropTypes = PropTypes.oneOf(["default","special"]);

export const ObjectDefinitionPropTypes = {
	href: PropTypes.string,
	text: PropTypes.string,
};

export const ArrayDefinitionPropTypes = PropTypes.arrayOf(PropTypes.string);

export const DemoObjectPropTypes = {
	inlineEnum: PropTypes.oneOf(["default","special"]),
	inlineEnumRequired: PropTypes.oneOf(["default","special"]).isRequired,
	inlineObject: PropTypes.shape({
		href: PropTypes.string,
		text: PropTypes.string,
	}),
	inlineObjectRequired: PropTypes.shape({
		href: PropTypes.string,
		text: PropTypes.string,
	}).isRequired,
	inlineArray: PropTypes.arrayOf(PropTypes.string),
	inlineArrayRequired: PropTypes.arrayOf(PropTypes.string).isRequired,
	arrRequired: PropTypes.arrayOf(PropTypes.string),
	refEnum: EnumDefinitionPropTypes,
	refEnumRequired: EnumDefinitionPropTypes.isRequired,
	refObject: PropTypes.shape(ObjectDefinitionPropTypes),
	refObjectRequired: PropTypes.shape(ObjectDefinitionPropTypes).isRequired,
	refArray: ArrayDefinitionPropTypes,
	refArrayRequired: ArrayDefinitionPropTypes.isRequired,
};
