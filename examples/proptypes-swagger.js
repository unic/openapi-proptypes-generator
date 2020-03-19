/* eslint no-use-before-define: 0 */
import PropTypes from 'prop-types';

export const ImgPropTypes = {
	src: PropTypes.string.isRequired,
	alt: PropTypes.string.isRequired,
};

export const LinkPropTypes = {
	href: PropTypes.string,
	text: PropTypes.string,
};

export const CarouselTeasersPropTypes = PropTypes.arrayOf(PropTypes.shape(NewsTeaserPropTypes));

export const ASimpleStringPropTypes = PropTypes.string;

export const ANumberPropTypes = PropTypes.number;

export const AnObjectPropTypes = {
	aNestedObject: PropTypes.shape({
		prop1: PropTypes.string,
		'2prop': PropTypes.string,
		nestedNestedObject: PropTypes.shape({
			myArray: PropTypes.arrayOf(PropTypes.string),
		}),
	}),
};

export const EmptyObjectPropTypes = {};

export const NewsTeaserPropTypes = {
	title: PropTypes.string,
	description: PropTypes.string,
	link: PropTypes.shape(LinkPropTypes),
	img: PropTypes.shape(ImgPropTypes),
};

export const NewsTeaserListPropTypes = PropTypes.arrayOf(
	PropTypes.shape(NewsTeaserPropTypes),
	PropTypes.shape({
		leadText: PropTypes.string,
	}),
);

export const FooterPropTypes = {
	title: PropTypes.string.isRequired,
	websiteDescription: PropTypes.string.isRequired,
	logo: PropTypes.shape(ImgPropTypes).isRequired,
	copyright: PropTypes.string,
	footerLinks: PropTypes.arrayOf(PropTypes.shape(LinkPropTypes)),
	':type': PropTypes.string,
};

export const ItemsOrderPropTypes = PropTypes.arrayOf(PropTypes.string);

export const OgsitePropTypes = PropTypes.string;
