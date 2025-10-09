import { spawn } from 'child_process';

// Track background processes so we can kill them on exit
export const bgChildren = new Set();

export function registerBackground(child) {
	bgChildren.add(child);
}

export function killAllBackground() {
	for (const child of Array.from(bgChildren)) {
		try {
			if (process.platform === 'win32') {
				spawn('taskkill', ['/PID', String(child.pid), '/T', '/F'], {
					shell: true,
					stdio: 'ignore',
				});
			} else {
				process.kill(-child.pid, 'SIGTERM');
			}
		} catch {}
	}
	bgChildren.clear();
}

let signalsRegistered = false;
export function ensureSignalHandlers() {
	if (signalsRegistered) return;
	signalsRegistered = true;
	process.on('SIGINT', () => {
		killAllBackground();
		process.exit(130);
	});
	process.on('SIGTERM', () => {
		killAllBackground();
		process.exit(143);
	});
}
