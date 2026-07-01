import { Stack, StackProps, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  Vpc, SubnetType, SecurityGroup, Peer, Port,
  InterfaceVpcEndpoint, InterfaceVpcEndpointAwsService,
  GatewayVpcEndpoint, GatewayVpcEndpointAwsService,
} from 'aws-cdk-lib/aws-ec2';

export class NetworkStack extends Stack {
  public readonly vpc: Vpc;
  public readonly albSecurityGroup: SecurityGroup;
  public readonly appSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: StackProps) {
    super(scope, id, props);

    this.vpc = new Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'isolated',
          subnetType: SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    this.albSecurityGroup = new SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: this.vpc,
      description: 'ALB: allow HTTP/HTTPS from internet',
      allowAllOutbound: false,
    });
    this.albSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(80), 'HTTP from anywhere');
    this.albSecurityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(443), 'HTTPS from anywhere');

    this.appSecurityGroup = new SecurityGroup(this, 'AppSecurityGroup', {
      vpc: this.vpc,
      description: 'App: allow traffic from ALB only',
      allowAllOutbound: true,
    });
    this.appSecurityGroup.addIngressRule(this.albSecurityGroup, Port.tcp(3000), 'Traffic from ALB');

    new GatewayVpcEndpoint(this, 'S3Endpoint', {
      service: GatewayVpcEndpointAwsService.S3,
      vpc: this.vpc,
    });

    new InterfaceVpcEndpoint(this, 'EcrEndpoint', {
      service: InterfaceVpcEndpointAwsService.ECR,
      vpc: this.vpc,
      privateDnsEnabled: true,
    });

    new InterfaceVpcEndpoint(this, 'EcrDkrEndpoint', {
      service: InterfaceVpcEndpointAwsService.ECR_DOCKER,
      vpc: this.vpc,
      privateDnsEnabled: true,
    });

    new InterfaceVpcEndpoint(this, 'CloudWatchLogsEndpoint', {
      service: InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      vpc: this.vpc,
      privateDnsEnabled: true,
    });

    new InterfaceVpcEndpoint(this, 'SecretsManagerEndpoint', {
      service: InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      vpc: this.vpc,
      privateDnsEnabled: true,
    });
  }
}
