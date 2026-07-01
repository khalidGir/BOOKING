import { App } from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack.js';
import { DatabaseStack } from '../lib/database-stack.js';
import { ServiceStack } from '../lib/service-stack.js';

const app = new App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
};

const network = new NetworkStack(app, 'BookingNetwork', { env });

const database = new DatabaseStack(app, 'BookingDatabase', {
  env,
  vpc: network.vpc,
  appSecurityGroup: network.appSecurityGroup,
});

new ServiceStack(app, 'BookingService', {
  env,
  vpc: network.vpc,
  albSecurityGroup: network.albSecurityGroup,
  appSecurityGroup: network.appSecurityGroup,
  databaseSecret: database.databaseSecret,
  redisCluster: database.redisCluster,
});

app.synth();
