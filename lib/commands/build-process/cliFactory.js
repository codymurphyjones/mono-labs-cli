import { program } from '../../app.js';
import { Command } from 'commander';
import runHasteCommand from './runHasteCommand.js';
import { verifyOptionValue } from './validators.js';
import { mergeData, setData } from './dataLayer.js';
import { getHasteConfig } from '../loadFromRoot.js';
import { pruneRepo } from '../prune/prune.js';
/**
 * Register commander commands for each haste file definition.
 * Handles argument, options, validation, and action wiring.
 */
export function createConfigCommands() {
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

export function createCliCommands() {
	const tools = new Command('tools').description('Manage tools');

	tools
		.command('prune')
		.description('Prune unused branches in git')
		.action(() => {
			console.log('Pruning unused branches...');
		});

	return tools;
}

export function buildCommands(files) {
	const { config } = getHasteConfig();
	Object.entries(files).forEach(([commandName, configObject]) => {
		const optionsData = configObject.options || {};

		console.log('configObject:', JSON.stringify(configObject, null, 2));

		let current = program
			.command(commandName)
			.description(configObject.description || 'Haste command');
		const argInfo = configObject.argument;
		// Argument
		if (argInfo) {
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

			console.log(arg);
			console.log(argInfo);
			console.log(argInfo.options);
			console.log(arg ?? argInfo.default);
			console.log(
				'logic calc',
				!argInfo.options.includes(arg ?? argInfo.default)
			);
			if (
				argInfo &&
				argInfo.options &&
				!argInfo.options.includes(arg ?? argInfo.default)
			) {
				throw new Error(
					`Invalid argument value for ${commandName}, must be one of: ${argInfo.options.join(
						', '
					)}`
				);
			}

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
			optionVals['prod'] = optionVals[config.prodFlag] || false;
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
