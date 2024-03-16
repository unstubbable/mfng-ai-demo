import * as cdk from 'aws-cdk-lib';
import type {Construct} from 'constructs';

export interface WebAclProps {
  readonly webAclName: string;
}

export class WebAcl extends cdk.aws_wafv2.CfnWebACL {
  constructor(scope: Construct, id: string, props: WebAclProps) {
    const {webAclName} = props;

    let rulePriority = 0;

    const createWebAclRule = (
      rule: Omit<
        cdk.aws_wafv2.CfnWebACL.RuleProperty,
        'priority' | 'visibilityConfig'
      >,
    ): cdk.aws_wafv2.CfnWebACL.RuleProperty => ({
      ...rule,
      priority: (rulePriority += 1),
      visibilityConfig: {
        cloudWatchMetricsEnabled: false,
        metricName: `${webAclName}-${rule.name}`,
        sampledRequestsEnabled: true,
      },
    });

    super(scope, id, {
      name: webAclName,
      scope: `CLOUDFRONT`,
      defaultAction: {
        allow: {},
      },
      visibilityConfig: {
        cloudWatchMetricsEnabled: false,
        metricName: webAclName,
        sampledRequestsEnabled: true,
      },
      rules: [
        createWebAclRule({
          name: `request-body-size-limit`,
          statement: {
            sizeConstraintStatement: {
              fieldToMatch: {body: {}},
              comparisonOperator: `GT`,
              size: 1024 * 10,
              textTransformations: [{priority: 0, type: `NONE`}],
            },
          },
          action: {block: {customResponse: {responseCode: 413}}},
        }),
        createWebAclRule({
          name: `rate-limit`,
          statement: {
            rateBasedStatement: {
              aggregateKeyType: `CONSTANT`,
              limit: 100, // 100 is the minimum
              scopeDownStatement: {
                byteMatchStatement: {
                  fieldToMatch: {method: {}},
                  positionalConstraint: `EXACTLY`,
                  searchString: `POST`,
                  textTransformations: [{priority: 0, type: `NONE`}],
                },
              },
            },
          },
          action: {block: {customResponse: {responseCode: 429}}},
        }),
      ],
    });
  }
}
