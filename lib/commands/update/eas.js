import { execSync } from 'child_process'

export function getEASChannels() {
	const channelsData = execSync(
		'yarn eas channel:list --non-interactive --json',
		{ stdio: ['pipe', 'pipe', 'ignore'] }, // Ignore stderr
	).toString()

	// Extract valid JSON from any extra noise
	const jsonStart = channelsData.indexOf('[')
	const jsonEnd = channelsData.lastIndexOf(']') + 1

	if (jsonStart === -1 || jsonEnd === -1) {
		throw new Error('JSON output not found in command output')
	}

	const jsonSlice = channelsData.slice(jsonStart, jsonEnd)
	const channels = JSON.parse(jsonSlice)
	return channels
}

export function getEASBranches() {
	const channelsData = execSync(
		'yarn eas branch:list --non-interactive --json',
		{ stdio: ['pipe', 'pipe', 'ignore'] }, // Ignore stderr
	).toString()

	// Extract valid JSON from any extra noise
	const jsonStart = channelsData.indexOf('[')
	const jsonEnd = channelsData.lastIndexOf(']') + 1

	if (jsonStart === -1 || jsonEnd === -1) {
		throw new Error('JSON output not found in command output')
	}

	const jsonSlice = channelsData.slice(jsonStart, jsonEnd)
	const channels = JSON.parse(jsonSlice)
	return channels
}
