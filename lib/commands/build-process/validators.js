// Option/value validation utilities
export function verifyOptionValue(optionKey, value, optionsData) {
	const optionInfo = optionsData[optionKey];
	if (optionInfo && Array.isArray(optionInfo.options)) {
		let actualOptions = optionInfo.options;
		if (actualOptions) {
			actualOptions =
				optionInfo?.allowAll ? [...actualOptions, 'all'] : [...actualOptions];
		}
		if (!actualOptions.includes(value)) {
			throw new Error(
				`Invalid value for --${optionKey}: ${value}. Valid options are: ${actualOptions.join(', ')}`
			);
		}
	}
	return value;
}
