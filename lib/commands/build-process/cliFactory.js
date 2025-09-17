import { program } from '../../app.js';
import runHasteCommand from './runHasteCommand.js';
import { verifyOptionValue } from './validators.js';
import { mergeData, setData } from './dataLayer.js';
import { getHasteConfig } from '../loadFromRoot.js';
/**
 * Register commander commands for each haste file definition.
 * Handles argument, options, validation, and action wiring.
 */
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

		current.action(async (arg, cmd) => {
			console.log('optionsData:', options);
			const optionVals = cmd.opts ? cmd.opts() : cmd;
			Object.keys(optionVals).forEach((k) => {
				optionVals[k] = verifyOptionValue(k, optionVals[k], optionsData);
			});
			const argVal = arg || configObject.argument?.default;
			console.log('optionVals:', optionVals);
			console.log('argVal:', argVal);
			mergeData({ ...optionVals, arg: argVal });
			await runHasteCommand(configObject, optionVals);
		});
	});
}

export default buildCommands;
