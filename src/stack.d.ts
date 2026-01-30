import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
export interface ICustomStack extends cdk.Stack {
    ownerName: string;
    region: string;
    enableNATGateway: boolean;
}
export interface CustomStackProps extends cdk.StackProps {
    ownerName?: string;
    region?: string;
    enableNATGateway?: boolean;
    domainName?: string;
}
export declare abstract class CustomStack extends cdk.Stack {
    ownerName: string;
    region: string;
    domainName?: string;
    protected enableNATGateway: boolean;
    constructor(scope: Construct, id: string, props?: CustomStackProps);
    initializeStackConfig(): void;
}
