import { Stack, StackProps, Duration, CfnOutput, Fn } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { IVpc, SecurityGroup, SubnetType } from 'aws-cdk-lib/aws-ec2';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import {
  Cluster, ContainerImage, FargateTaskDefinition,
  LogDrivers, HealthCheck,
} from 'aws-cdk-lib/aws-ecs';
import { ApplicationLoadBalancedFargateService } from 'aws-cdk-lib/aws-ecs-patterns';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import {
  ApplicationProtocol, SslPolicy,
} from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import {
  DnsValidatedCertificate,
} from 'aws-cdk-lib/aws-certificatemanager';
import {
  ManagedPolicy, Role, ServicePrincipal, PolicyStatement, Effect,
} from 'aws-cdk-lib/aws-iam';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

export interface ServiceStackProps extends StackProps {
  vpc: IVpc;
  albSecurityGroup: SecurityGroup;
  appSecurityGroup: SecurityGroup;
  databaseSecret: Secret;
  redisAddress: string;
  redisPort: string;
}

export class ServiceStack extends Stack {
  constructor(scope: Construct, id: string, props: ServiceStackProps) {
    super(scope, id, props);

    const { vpc, albSecurityGroup, appSecurityGroup, databaseSecret, redisAddress, redisPort } = props;
    const domainName = this.node.tryGetContext('domainName') as string | undefined;

    // ── ECR Repository ────────────────────────────────────────────
    const repository = new Repository(this, 'Repository', {
      repositoryName: 'booking-app',
      imageScanOnPush: true,
      lifecycleRules: [{ maxImageCount: 10 }],
    });

    // ── JWT Secret via SSM ────────────────────────────────────────
    const jwtSecretParam = new StringParameter(this, 'JwtSecretParam', {
      parameterName: '/booking/JWT_SECRET',
      stringValue: 'replace-with-random-secret',
    });

    // ── ECS Cluster ───────────────────────────────────────────────
    const cluster = new Cluster(this, 'Cluster', {
      vpc,
      clusterName: 'booking-cluster',
      containerInsights: true,
    });

    // ── IAM Role ──────────────────────────────────────────────────
    const taskRole = new Role(this, 'TaskRole', {
      assumedBy: new ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });
    databaseSecret.grantRead(taskRole);
    jwtSecretParam.grantRead(taskRole);

    // ── Task Definition ───────────────────────────────────────────
    const taskDef = new FargateTaskDefinition(this, 'TaskDef', {
      family: 'booking-task',
      cpu: 256,
      memoryLimitMiB: 512,
      executionRole: taskRole,
      taskRole,
    });

    const secretUsername = databaseSecret.secretValueFromJson('username');
    const secretPassword = databaseSecret.secretValueFromJson('password');
    const secretHost = databaseSecret.secretValueFromJson('host');
    const secretPort = databaseSecret.secretValueFromJson('port');
    const secretDbname = databaseSecret.secretValueFromJson('dbname');

    taskDef.addContainer('App', {
      containerName: 'booking-app',
      image: ContainerImage.fromEcrRepository(repository, 'latest'),
      containerPort: 3000,
      logging: LogDrivers.awsLogs({
        streamPrefix: 'booking',
        logRetention: 14,
      }),
      healthCheck: HealthCheck.builder()
        .command(['CMD-SHELL', 'curl -f http://localhost:3000/health || exit 1'])
        .interval(Duration.seconds(30))
        .timeout(Duration.seconds(5))
        .retries(3)
        .startPeriod(Duration.seconds(60))
        .build(),
      environment: {
        NODE_ENV: 'production',
        PORT: '3000',
        CACHE_BUILD_HOUR: '3',
        JWT_SECRET: jwtSecretParam.stringValue,
        DATABASE_URL: Fn.join('', [
          'postgresql://', secretUsername, ':', secretPassword,
          '@', secretHost, ':', secretPort, '/', secretDbname,
        ]),
        REDIS_URL: Fn.join('', [
          'redis://', redisAddress, ':', redisPort,
        ]),
      },
      cpu: 256,
      memoryLimitMiB: 512,
    });

    // ── ALB + Fargate Service ─────────────────────────────────────
    let certificate: DnsValidatedCertificate | undefined;

    if (domainName) {
      certificate = new DnsValidatedCertificate(this, 'Certificate', {
        domainName,
        hostedZone: {
          zoneName: domainName,
          hostedZoneId: this.node.tryGetContext('hostedZoneId')!,
        },
        region: 'us-east-1',
      });
    }

    const fargateService = new ApplicationLoadBalancedFargateService(this, 'Service', {
      cluster,
      taskDefinition: taskDef,
      desiredCount: 1,
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
      securityGroups: [appSecurityGroup],
      assignPublicIp: false,
      taskSubnets: { subnetType: SubnetType.PRIVATE_WITH_EGRESS },
      listenerPort: domainName ? 443 : 80,
      protocol: domainName ? ApplicationProtocol.HTTPS : ApplicationProtocol.HTTP,
      sslPolicy: domainName ? SslPolicy.RECOMMENDED : undefined,
      certificate,
      redirectHTTP: !!domainName,
      publicLoadBalancer: true,
      idleTimeout: Duration.seconds(60),
    });

    fargateService.targetGroup.configureHealthCheck({
      path: '/health',
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 3,
      interval: Duration.seconds(30),
      timeout: Duration.seconds(5),
    });

    // ── Auto-scaling ──────────────────────────────────────────────
    const scaling = fargateService.service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 3,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: Duration.seconds(120),
      scaleOutCooldown: Duration.seconds(60),
    });

    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: Duration.seconds(120),
      scaleOutCooldown: Duration.seconds(60),
    });

    // ── Allow ECS to pull from ECR ────────────────────────────────
    repository.grantPullPush(taskRole);

    // ── Outputs ───────────────────────────────────────────────────
    new CfnOutput(this, 'LoadBalancerDNS', {
      value: fargateService.loadBalancer.loadBalancerDnsName,
    });

    new CfnOutput(this, 'EcrRepositoryUri', {
      value: repository.repositoryUri,
    });

    new CfnOutput(this, 'ClusterName', {
      value: cluster.clusterName,
    });

    new CfnOutput(this, 'ServiceName', {
      value: fargateService.service.serviceName,
    });
  }
}
