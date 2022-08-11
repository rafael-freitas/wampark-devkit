// const welcome = require('cli-welcome');
// const pkg = require('./../package.json');
// const unhandled = require('cli-handle-unhandled');

import { createRequire } from "module"
import welcome from 'cli-welcome'
import unhandled from 'cli-handle-unhandled'

// import pkg from '../../package.json'

const require = createRequire(import.meta.url);
const pkg = require('../../package.json');

export default ({ clear = true }) => {
	unhandled();
	welcome({
		title: `wamp-cli`,
		tagLine: `by Rafael Freitas Lima`,
		description: pkg.description,
		version: pkg.version,
		bgColor: '#36BB09',
		color: '#000000',
		bold: true,
		clear
	});
};
