import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import { loadMergedEnv } from '../project/index'
import { writeLog } from '@mono-labs/shared'

loadMergedEnv()
//cdk deploy --context owner=cody --context region=us-west-1

const dev = 'dev'
export interface ICustomStack extends cdk.Stack {
  ownerName: string
  region: string
  enableNATGateway: boolean
}

export interface CustomStackProps extends cdk.StackProps {
  ownerName?: string
  region?: string
  enableNATGateway?: boolean
  domainName?: string
}

export abstract class CustomStack extends cdk.Stack {
  public ownerName: string
  public region: string
  public domainName?: string
  protected enableNATGateway: boolean = false

  constructor(scope: Construct, id: string, props: CustomStackProps = {}) {
    // Resolve account + region BEFORE super()
    const resolvedEnv: cdk.Environment | undefined = {
      account: props.env?.account ?? process.env.AWS_ACCOUNT ?? cdk.Aws.ACCOUNT_ID, // final fallback (lazy token)
      region: props.env?.region ?? process.env.AWS_REGION ?? 'us-east-2',
    }

    super(scope, id, {
      ...props,
      env: resolvedEnv,
    })

    // Now it's safe to read these
    this.ownerName = props.ownerName ?? 'dev'
    this.domainName = props.domainName
    this.region = resolvedEnv.region!
    this.enableNATGateway = props.enableNATGateway ?? false
  }

  public initializeStackConfig(): void {
    // Context overrides (deploy-time flags)
    const ctxOwner = this.node.tryGetContext('owner') || dev
    const ctxRegion = this.node.tryGetContext('region') || 'us-east-2'
    const ctxNat = this.node.tryGetContext('enableNATGateway')

    if (ctxOwner) this.ownerName = ctxOwner
    if (ctxRegion) this.region = ctxRegion

    // NAT logic
    if (ctxNat !== undefined) {
      this.enableNATGateway = ctxNat === 'true'
    }

    // Production default
    if (this.ownerName === 'prod' || this.ownerName === 'production') {
      this.enableNATGateway = ctxNat !== 'false'
    }

    writeLog('[Stack Config]', {
      owner: this.ownerName,
      region: this.region,
      account: this.account,
      natGateway: this.enableNATGateway,
    })
  }
}
