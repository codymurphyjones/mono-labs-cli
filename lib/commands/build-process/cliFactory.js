import { program } from '../../app.js';
import { Command } from 'commander';
import runHasteCommand from './runHasteCommand.js';
import { verifyOptionValue } from './validators.js';
import { mergeData, setData } from './dataLayer.js';
import { getHasteConfig } from '../loadFromRoot.js';
import { pruneRepo } from '../prune/prune.js';
import { testFlag } from './testflag.js';
/**
 * Register commander commands for each haste file definition.
 * Handles argument, options, validation, and action wiring.
 */
export function createConfigCommands() {
	const config = new Command('config').description('Manage configuration');

	config
		.command('set <key> <value>')
		.description('Set a configuration value')
		.action((key, value) => {});

	config
		.command('get <key>')
		.description('Get a configuration value')
		.action((key) => {});

	config
		.command('list')
		.description('List all configuration values')
		.action(() => {});

	return config;
}

export function createCliCommands() {
	const tools = new Command('tools').description('Manage tools');

	tools
		.command('prune')
		.description('Prune unused branches in git')
		.action(() => {});

	return tools;
}

export function buildCommands(files) {
	try {
		const { config } = getHasteConfig();
		Object.entries(files).forEach(([commandName, configObject]) => {
			const optionsData = configObject.options || {};

			let current = program
				.command(commandName)
				.description(configObject.description || 'Mono command');
			const argInfo = configObject.argument;
			// Argument
			if (argInfo) {
				const required = !!argInfo.required;
				const type = argInfo.type || 'string';
				const argSpec = required ? `<${type}>` : `[${type}]`;
				current = current.argument(argSpec, argInfo.description || '');
			}
			if (testFlag)
				console.log(
					'firstConfigObject:',
					JSON.stringify(configObject, null, 2)
				);

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
				const optionValueList = argInfo.options;
				let actualOptions = optionValueList;
				if (optionValueList) {
					actualOptions =
						argInfo?.allowAll ?
							[...optionValueList, 'all']
						:	[...optionValueList];
				}

				if (argInfo) {
					if (
						argInfo &&
						optionValueList &&
						!actualOptions.includes(arg ?? argInfo.default)
					) {
						throw new Error(
							`Invalid argument value for ${commandName}, must be one of: ${actualOptions.join(
								', '
							)}`
						);
					}
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

				// optionsData
				// 	.filter((item) => item.default !== undefined)
				// 	.forEach((item) => {
				// 		envDefaults[item] = item.default;
				// 	});

				try {
					const optionVals = {
						...envDefaults,
						...(cmd.opts ? cmd.opts() : cmd),
					};

					Object.keys(optionVals).forEach((k) => {
						optionVals[k] = verifyOptionValue(k, optionVals[k], optionsData);
					});
					optionVals['prod'] = optionVals[config.prodFlag] || false;

					const argVal = arg || configObject.argument?.default;

					mergeData({ ...optionVals, arg: argVal });
					await runHasteCommand(configObject, optionVals);
				} catch (err) {
					console.error('Error executing mono command:', err.message);
				}
			});
		});
	} catch (err) {
		console.error('Error executing mono command:', err.message);
	}
}

export default buildCommands;
