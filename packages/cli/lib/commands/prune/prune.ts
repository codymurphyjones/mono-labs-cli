import { execSync } from 'child_process'

const log = (...args: unknown[]) => console.log(...args)
const err = (...args: unknown[]) => console.error(...args)
export function pruneRepo() {
  try {
    // Fetch and prune remote branches
    log('Fetching latest branch data from origin...')
    execSync('git fetch --prune', { stdio: 'inherit' })

    // Get local branches (trim whitespace)
    const localBranches = execSync("git branch --format '%(refname:short)'")
      .toString()
      .trim()
      .split('\n')
      .map((branch) => branch.trim().replaceAll("'", ''))

    // Get remote branches (remove "origin/" prefix)
    const remoteBranches = execSync('git branch -r')
      .toString()
      .trim()
      .split('\n')
      .map((branch) => branch.replace(/^\s*origin\//, '').trim())

    // Find local branches that are NOT in remote branches
    const branchesToDelete = localBranches.filter((branch) => !remoteBranches.includes(branch))
    if (branchesToDelete.length === 0) {
      log('No local branches to delete.')
      process.exit(0)
    }

    // Delete untracked local branches
    log('Deleting local branches that are not on origin...')
    branchesToDelete.forEach((branch) => {
      log(`Attempting to delete: ${branch}`)
      try {
        execSync(`git branch -D ${branch}`, { stdio: 'inherit' })
        log(`Deleted: ${branch}`)
      } catch (caught: unknown) {
        const error = caught as { message?: string }
        err(`Failed to delete branch ${branch}:`, error.message ?? String(caught))
      }
    })

    log('Cleanup complete!')
  } catch (caught: unknown) {
    const error = caught as { message?: string }
    err('An error occurred:', error.message ?? String(caught))
  }
}
