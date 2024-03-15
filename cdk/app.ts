import * as cdk from 'aws-cdk-lib';
import './env.js';
import {MainStack} from './main-stack.js';
import {WafStack} from './waf-stack.js';

const app = new cdk.App();

const wafStack = new WafStack(app, `mfng-ai-demo-waf`, {
  crossRegionReferences: true,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    // For a web ACL with CLOUDFRONT scope, the WAF resources must be created in
    // the US East (N. Virginia) Region, us-east-1.
    region: `us-east-1`,
  },
  webAclName: `mfng-ai-demo-waf`,
});

new MainStack(app, `mfng-ai-demo-app`, {
  crossRegionReferences: true,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  bucketName: `mfng-ai-demo-app-assets`,
  customDomain: {domainName: `strict.software`, subdomainName: `mfng-ai-demo`},
  webAcl: wafStack.webAcl,
});