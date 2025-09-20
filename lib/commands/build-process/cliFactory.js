import { program } from '../../app.js';
import { Command } from 'commander';
import runHasteCommand from './runHasteCommand.js';
import { verifyOptionValue } from './validators.js';
import { mergeData, setData } from './dataLayer.js';
import { getHasteConfig } from '../loadFromRoot.js';
/**
 * Register commander commands for each haste file definition.
 * Handles argument, options, validation, and action wiring.
 */
export function createCliCommands() {
	const config = new Command('config').description('Manage configuration');

	config
		.command('set <key> <value>')
		.description('Set a configuration value')
		.action((key, value) => {
			console.log(`Setting ${key} to ${value}`);
		});

	config
		.command('get <key>')
		.description('Get a configuration value')
		.action((key) => {
			console.log(`Value of ${key} is ...`);
		});

	config
		.command('list')
		.description('List all configuration values')
		.action(() => {
			console.log('Listing config...');
		});

	return config;
}

export function buildCommands(files) {
	const { config } = getHasteConfig();
	Object.entries(files).forEach(([commandName, configObject]) => {
		const optionsData = configObject.options || {};

		let current = program
			.command(commandName)
			.description(configObject.description || 'Haste command');

		// Argument
		if (configObject.argument) {
			const argInfo = configObject.argument;
			const required = !!argInfo.required;
			const type = argInfo.type || 'string';
			const argSpec = required ? `<${type}>` : `[${type}]`;
			current = current.argument(argSpec, argInfo.description || '');
		}

		// Options
		Object.entries(optionsData).forEach(([optionKey, meta]) => {
			const type = meta.type || 'boolean';
			const shortcut = meta.shortcut ? `-${meta.shortcut}, ` : '';
			if (type === 'string') {
				current = current.option(
					`${shortcut}--${optionKey} <${optionKey}>`,
					meta.description || ''
				);
				if (meta.default !== undefined) setData(optionKey, meta.default);
			} else {
				current = current.option(
					`${shortcut}--${optionKey}`,
					meta.description || ''
				);
				if (meta.default !== undefined) setData(optionKey, meta.default);
			}
		});
		config.prodFlag = config.prodFlag || 'prod';

		current = current.option(
			`--${config.prodFlag}`,
			'Process execution mode: prduction or dev',
			false
		);

		current.action(async (arg, cmd) => {
			let envDefaults = {};

			const optionsDataList = Object.keys(optionsData).map((key) => ({
				...optionsData[key],
				name: key,
			}));

			optionsDataList.map((item) => {
				if (item.default) {
					envDefaults[item.name] = item.default;
				}
			});
			console.log('optionsData:', optionsData);

			console.log('optionsDataList:', optionsDataList);
			// optionsData
			// 	.filter((item) => item.default !== undefined)
			// 	.forEach((item) => {
			// 		envDefaults[item] = item.default;
			// 	});
			console.log('optionsData:', optionsData);
			console.log('envDefaults', envDefaults);
			const optionVals = { ...(cmd.opts ? cmd.opts() : cmd), ...envDefaults };
			console.log('optionVals before verify:', optionVals);
			Object.keys(optionVals).forEach((k) => {
				optionVals[k] = verifyOptionValue(k, optionVals[k], optionsData);
			});
			console.log('optionVals after verify:', optionVals);

			console.log('envDefaults', envDefaults);
			const argVal = arg || configObject.argument?.default;
			console.log('optionVals:', optionVals);
			console.log('argVal:', argVal);
			mergeData({ ...optionVals, arg: argVal, ...envDefaults });
			await runHasteCommand(configObject, optionVals);
		});
	});
}

export default buildCommands;
