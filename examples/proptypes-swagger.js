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

export const CarouselTeasersPropTypes = {
	carouselTeasers: PropTypes.arrayOf(PropTypes.shape(NewsTeaserPropTypes)),
};

export const ASimpleStringPropTypes = {
	aSimpleString: PropTypes.string,
};

export const ANumberPropTypes = {
	aNumber: PropTypes.number,
};

export const AnObjectPropTypes = {
	aNestedObject: PropTypes.shape({
		prop1: PropTypes.string,
		'2prop': PropTypes.string,
		nestedNestedObject: PropTypes.shape({
			myArray: PropTypes.arrayOf(PropTypes.string),
		}),
	}),
};

export const NewsTeaserPropTypes = {
	title: PropTypes.string,
	description: PropTypes.string,
	link: PropTypes.PropTypes.shape(LinkPropTypes),
	img: PropTypes.PropTypes.shape(ImgPropTypes),
};

export const FooterPropTypes = {
	title: PropTypes.string.isRequired,
	websiteDescription: PropTypes.string.isRequired,
	logo: PropTypes.PropTypes.shape(ImgPropTypes).isRequired,
	copyright: PropTypes.string,
	footerLinks: PropTypes.arrayOf(PropTypes.shape(LinkPropTypes)),
	':type': PropTypes.string,
};

export const ItemsOrderPropTypes = {
	':itemsOrder': PropTypes.arrayOf(PropTypes.string),
};
