import * as cdk from 'aws-cdk-lib';
import './env.js';
import {Stack} from './stack.js';

const app = new cdk.App();

new Stack(app, `mfng-ai-demo-preview`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    // A web ACL with CLOUDFRONT scope, and the certificate for CloudFront, must
    // both be created in the US East (N. Virginia) Region, us-east-1.
    region: `us-east-1`,
  },
  bucketName: `mfng-ai-demo-preview-assets`,
  customDomain: {
    domainName: `strict.software`,
    subdomainName: `ai-demo-preview.mfng`,
  },
  webAclName: `mfng-ai-demo-preview`,
});
