#!/usr/bin/env node

/**
 * wamp-cli
 * WAMP project CLI
 *
 * @author Rafael Freitas Lima <tag.mx>
 */

import init from './utils/init.js'
import cli from './utils/cli.js'
import log from './utils/log.js'
import readline from 'readline'
import initAppliction from '../init.js'
// const init = require('./utils/init');
// const cli = require('./utils/cli');
// const log = require('./utils/log');
// const readline = require('readline')
// const system_users = require('../src/store/models/system_users/index.js')
import system_users from '../db/models/system_users/index.js'

const input = cli.input;
const flags = cli.flags;
const { clear, debug } = flags;

const app = initAppliction()
console.log('Waiting Application initialization')
app.on('init', async () => {
	// init({ clear });
	input.includes(`help`) && cli.showHelp(0);

	input.includes('newuser') && await async function () {
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
			terminal: false
		});

		const user = {
			name: '',
			login: '',
			pass: '',
			email: '',
		}

		const question1 = () => {
			return new Promise((resolve, reject) => {
				rl.question('User name: ', (answer) => {
					user.name = answer
					resolve()
				})
			})
		}
		
		const question2 = () => {
			return new Promise((resolve, reject) => {
				rl.question('Login / identifier: ', (answer) => {
					user.identifier = answer
					resolve()
				})
			})
		}
		
		const question3 = () => {
			return new Promise((resolve, reject) => {
				rl.question('Password: ', (answer) => {
					user.password = answer
					resolve()
				})
			})
		}
		
		const question4 = () => {
			return new Promise((resolve, reject) => {
				rl.question('Email: ', (answer) => {
					user.email = answer
					resolve()
				})
			})
		}
		
		const main = async () => {
			await question1()
			await question2()
			await question3()
			await question4()
			// rl.close()
			console.log(`Creating user...:`)
			console.log(`Name: ${user.name}`)
			console.log(`Login / identifier: ${user.identifier}`)
			console.log(`Email: ${user.email}`)
			console.log(`Password: ${user.password}`)

			let doc = new system_users(user)
			try {
				let result = await doc.save()
				console.log(`User created: `, result)
			} catch (error) {
				console.error(`Fail to create user `, error)
			}
			finally {
				rl.close()
				process.exit(0)
			}
			
		}

		main()

	}()

	debug && log(flags);
})
