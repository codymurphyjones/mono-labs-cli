// Option/value validation utilities
export function verifyOptionValue(optionKey, value, optionsData) {
	const optionInfo = optionsData[optionKey];
	if (optionInfo && Array.isArray(optionInfo.options)) {
		if (!optionInfo.options.includes(value)) {
			throw new Error(
				`Invalid value for --${optionKey}: ${value}. Valid options are: ${optionInfo.options.join(', ')}`
			);
		}
	}
	return value;
}
