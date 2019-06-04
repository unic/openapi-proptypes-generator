module.exports = {
	extends: [
		'airbnb-base',
		'plugin:prettier/recommended',
	],
	'env': {
		'node': true,
		'es6': true,
	},
	parser: 'babel-eslint',
	parserOptions: {
		sourceType: 'module',
		allowImportExportEverywhere: false,
		codeFrame: false,
	},
	rules: {
		indent: [
			2,
			'tab',
			{
				'SwitchCase': 1,
				'VariableDeclarator': 1
			}
		],
		'max-len': 0,
		'no-tabs': 0,
		'no-underscore-dangle': 0,
	},
};
