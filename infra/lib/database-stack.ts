import { Stack, StackProps, Duration, Fn } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecurityGroup, Peer, Port, SubnetType, IVpc, InstanceType, InstanceClass, InstanceSize } from 'aws-cdk-lib/aws-ec2';
import {
  DatabaseInstance, DatabaseInstanceEngine, PostgresEngineVersion,
  Credentials, StorageType,
} from 'aws-cdk-lib/aws-rds';
import {
  CfnCacheCluster, CfnSubnetGroup,
} from 'aws-cdk-lib/aws-elasticache';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';

export interface DatabaseStackProps extends StackProps {
  vpc: IVpc;
  appSecurityGroup: SecurityGroup;
}

export class DatabaseStack extends Stack {
  public readonly databaseSecret: Secret;
  public readonly redisAddress: string;
  public readonly redisPort: string;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const { vpc, appSecurityGroup } = props;

    // ── RDS PostgreSQL ───────────────────────────────────────────
    const dbSecurityGroup = new SecurityGroup(this, 'DbSecurityGroup', {
      vpc,
      description: 'RDS: allow PostgreSQL from app',
      allowAllOutbound: false,
    });
    dbSecurityGroup.addIngressRule(appSecurityGroup, Port.tcp(5432), 'PostgreSQL from app');

    this.databaseSecret = new Secret(this, 'DatabaseSecret', {
      secretName: 'booking-database-credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'booking_admin', dbname: 'booking' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        includeSpace: false,
      },
    });

    const db = new DatabaseInstance(this, 'Postgres', {
      engine: DatabaseInstanceEngine.postgres({ version: PostgresEngineVersion.VER_16_4 }),
      vpc,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_ISOLATED },
      securityGroups: [dbSecurityGroup],
      instanceType: InstanceType.of(InstanceClass.T4G, InstanceSize.MICRO),
      credentials: Credentials.fromSecret(this.databaseSecret),
      databaseName: 'booking',
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      storageType: StorageType.GP3,
      backupRetention: Duration.days(7),
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-05:00',
      deletionProtection: true,
      deleteAutomatedBackups: false,
      multiAz: false,
      publiclyAccessible: false,
    });

    // ── ElastiCache Redis ─────────────────────────────────────────
    const redisSecurityGroup = new SecurityGroup(this, 'RedisSecurityGroup', {
      vpc,
      description: 'Redis: allow Redis from app',
      allowAllOutbound: false,
    });
    redisSecurityGroup.addIngressRule(appSecurityGroup, Port.tcp(6379), 'Redis from app');

    const redisSubnetGroup = new CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Subnet group for Redis',
      subnetIds: vpc.isolatedSubnets.map(s => s.subnetId),
    });

    const redis = new CfnCacheCluster(this, 'Redis', {
      engine: 'redis',
      cacheNodeType: 'cache.t4g.micro',
      numCacheNodes: 1,
      vpcSecurityGroupIds: [redisSecurityGroup.securityGroupId],
      cacheSubnetGroupName: redisSubnetGroup.ref,
      autoMinorVersionUpgrade: true,
      preferredMaintenanceWindow: 'sun:05:00-06:00',
    });

    this.redisAddress = redis.attrRedisEndpointAddress;
    this.redisPort = redis.attrRedisEndpointPort;
  }
}
