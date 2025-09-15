#!/usr/bin/env node
import { execSync, spawnSync } from 'child_process'
import fs from 'fs'
import inquirer from 'inquirer'
import os from 'os'
import path from 'path'

async function maybeEditFile() {
	const { shouldEdit } = await inquirer.prompt([
		{
			type: 'confirm',
			name: 'shouldEdit',
			message: 'Do you want to edit the commit message in your Git editor?',
			default: true,
		},
	])

	if (shouldEdit) {
		execSync('git commit --amend')
	}
}

async function confirmDangerousSquash() {
	const { shouldEdit } = await inquirer.prompt([
		{
			type: 'confirm',
			name: 'shouldEdit',
			message:
				"You're about to squash on a previously squashed commit.  You will need to manually modify the commit message. Do you want to proceed?",
			default: true,
		},
	])

	return shouldEdit
}

export async function squash() {
	const status = execSync('git status --porcelain').toString()
	if (status.trim() !== '') {
		console.error('You have unstaged  changes. Please commit or stash them before proceeding.')
		process.exit(1)
	}
	const log = execSync(`git log --reverse --pretty=format:"%h %s" -n ${20}`).toString()
	console.log('Log:\n', log)

	const commits = log
		.split('\n')
		.reverse()
		.map((line, idx) => {
			console.log('message', line.slice(8).split('- '))
			return {
				name: `${idx} [${line.slice(0, 7)}] : ${line.slice(8)}`,
				value: idx, // Just the commit message
				message: line.slice(8).split('- ').join('\n- '),
			}
		})
	console.log(commits)

	const { count } = await inquirer.prompt([
		{
			type: 'list',
			name: 'count',
			message: 'Select commit to squash down into:',
			choices: commits,
		},
	])

	if (count === 0) {
		console.log('You may not squash only one commit.')
		return
	}
	let totalMerged = 0
	const commitMessageGen = commits
		.slice(0, count + 1)
		.map((msg) => {
			return msg.message
		})
		.map((msg) => `${msg}`)
		.join('\n')

	let shouldContinue = true
	const match = commitMessageGen.match(/Merging (\d+)\s+into singular commit/)
	if (match) {
		shouldContinue = await confirmDangerousSquash()
		console.log('Unable to merge with merged commits')
		if (!shouldContinue) return
	}

	console.log('Total merged:', totalMerged)
	console.log(count + 1 + totalMerged)
	const commitMessage = `Merging ${count + 1 + totalMerged} into singular commit\n${commitMessageGen}`

	console.log(`Commit message:\n${commitMessage}`)

	// Write message to temp file
	const tempMessagePath = path.join(os.tmpdir(), 'git_squash_message.txt')
	fs.writeFileSync(tempMessagePath, commitMessage)

	if (shouldContinue) {
		const { confirmSquash } = await inquirer.prompt([
			{
				type: 'confirm',
				name: 'confirmSquash',
				message: 'Do you want to squash these commits?',
				default: true, // or false if you want "No" as the default
			},
		])

		shouldContinue = confirmSquash
	}

	if (!shouldContinue) return
	// proceed with

	// GIT_EDITOR override for rebase message
	const isWin = process.platform === 'win32'
	const editorScript = path.join(os.tmpdir(), isWin ? 'git-editor.bat' : 'git-editor.sh')
	const messagePath = path.join(os.tmpdir(), 'commit-message.txt')

	fs.writeFileSync(messagePath, commitMessage)

	if (isWin) {
		fs.writeFileSync(editorScript, `@echo off\r\ncopy /Y "${messagePath}" %1 > nul\r\n`)
	} else {
		fs.writeFileSync(editorScript, `#!/bin/sh\ncat "${messagePath}" > "$1"\n`)
		fs.chmodSync(editorScript, '755')
	}

	console.log('Starting interactive rebase...')

	spawnSync('git', ['reset', '--soft', `HEAD~${count + 1}`], { stdio: 'inherit' })

	spawnSync('git', ['commit', '-m', commitMessage], { stdio: 'inherit' })

	const rebaseResult = spawnSync('git', ['rebase', `HEAD~${count}`], {
		stdio: 'inherit',
		env: { ...process.env, GIT_EDITOR: editorScript },
	})

	console.log(`Rebase result: ${rebaseResult.status}`)

	if (rebaseResult.status !== 0) {
		console.error('Rebase failed. Resolve conflicts and try again.')
		process.exit(rebaseResult.status)
	}

	await maybeEditFile()

	console.log('✅ Rebase complete.')
}
