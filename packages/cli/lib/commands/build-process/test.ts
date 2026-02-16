import { execSync } from 'child_process'
import { getRootJson, getMonoConfig } from '../loadFromRoot'

//Run Action List before all script actions

const WorkSpaceDirectory = '${dir}'

export function executeCommandsIfWorkspaceAction(
  action: any,
  commands: string[] = [],
  fullEnv: NodeJS.ProcessEnv
): void {
  const { config } = getMonoConfig() as { config: any }
  const workspacemap = config.workspace?.packageMaps || {}

  const result = execSync('yarn workspaces list --json', { encoding: 'utf8' })
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line))
    .filter((obj) => obj !== '.')

  const actualAction = workspacemap ? workspacemap[action[1]] || action[1] : action[1]

  const rootJson = getRootJson() as any
  void rootJson

  const filteredResult = result.filter((obj) => obj.name === actualAction)[0] || {}
  const workingDirectory = filteredResult.location || ''

  // Check if the action is a workspace action
  if (action) {
    // Execute each command in the context of the workspace
    commands.forEach((cmd) => {
      const finalCommand = cmd.replace(WorkSpaceDirectory, workingDirectory)

      execSync(finalCommand, {
        stdio: 'inherit',
        env: { ...fullEnv },
      })
    })
  }
}
