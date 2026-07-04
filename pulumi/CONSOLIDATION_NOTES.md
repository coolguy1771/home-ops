# Pulumi Projects Consolidation Notes

This document outlines the current state of AWS projects and recommendations for consolidation.

## Current State

### AWS Projects Overview

#### 1. `pulumi/aws/icb/` - **ACTIVE & PRODUCTION-READY**
**Purpose**: Comprehensive CDN infrastructure for icbplays.net

**Resources**:
- Route 53 Hosted Zone (icbplays.net)
- KMS Key for DNSSEC signing
- S3 Bucket (icb-d9ff5992) with website hosting
- ACM Certificate for cdn.icbplays.net
- CloudFront Distribution with:
  - Custom SSL certificate
  - WAF (Web Application Firewall) with AWS managed rule sets
  - Geo-restriction (whitelist for SE, US, IE, CA, AU, GB)
  - Origin Shield enabled
  - CloudFront Functions for index handling
- S3 Bucket Policy for public read access
- CORS configuration

**Status**: ✅ Active, well-maintained, production-ready

#### 2. `pulumi/aws/oidc/` - **ACTIVE & PRODUCTION-READY**
**Purpose**: AWS OIDC provider for Pulumi service authentication

**Resources**:
- IAM OIDC Identity Provider
- IAM Role with AdministratorAccess
- Pulumi ESC Environment configuration

**Status**: ✅ Active, well-maintained, production-ready

#### 3. `pulumi/aws/ses/` - **ACTIVE & RECENTLY IMPROVED**
**Purpose**: SES configuration for email sending

**Resources**:
- SES Domain Identity
- Route 53 verification records
- SES Configuration Set

**Status**: ✅ Active, recently updated with proper config management

#### 4. `pulumi/icb/` - **PARTIALLY ACTIVE, NEEDS CLEANUP**
**Purpose**: Originally intended as main infrastructure project

**Issues**:
- ❌ ~60% of code is commented out
- ❌ Contains outdated/basic CDN code in `aws/cdn.ts` (superseded by `aws/icb`)
- ❌ Had empty placeholder files (r53.ts, ses.ts) - **NOW REMOVED**
- ⚠️ Only actively using VPC and DNS record creation
- ⚠️ Most infrastructure modules are disabled

**Status**: ⚠️ Partially active but needs cleanup

## Identified Issues (Now Resolved)

### ✅ Empty Files - REMOVED
- ~~`pulumi/icb/aws/r53.ts` (0 bytes)~~
- ~~`pulumi/icb/aws/ses.ts` (0 bytes)~~

**Resolution**: Removed these empty placeholder files.

### ⚠️ Duplicate CDN Implementation

**Duplication**:
- `pulumi/aws/icb/` - Comprehensive production CDN (300 lines)
- `pulumi/icb/aws/cdn.ts` - Basic CDN implementation (76 lines)

**Comparison**:

| Feature | aws/icb | icb/aws/cdn.ts |
|---------|---------|----------------|
| S3 Bucket | ✅ | ✅ |
| CloudFront | ✅ | ✅ |
| Custom Domain | ✅ cdn.icbplays.net | ❌ |
| ACM Certificate | ✅ | ❌ |
| WAF Protection | ✅ | ❌ |
| Geo-Restrictions | ✅ | ❌ |
| Route 53 Zone | ✅ | ❌ |
| KMS for DNSSEC | ✅ | ❌ |
| Origin Shield | ✅ | ❌ |
| CloudFront Functions | ✅ | ❌ |
| Status | Production | Template/Unused |

**Recommendation**: The code in `pulumi/icb/aws/cdn.ts` appears to be an older template that is superseded by the production implementation in `pulumi/aws/icb/`.

## Recommendations

### Option 1: Keep Current Structure (RECOMMENDED)
Keep the separate AWS projects as they are well-organized and serve distinct purposes:
- `pulumi/aws/icb/` - CDN infrastructure
- `pulumi/aws/oidc/` - Authentication infrastructure
- `pulumi/aws/ses/` - Email infrastructure

**Actions**:
1. ✅ Remove `pulumi/icb/aws/cdn.ts` (superseded by aws/icb)
2. ✅ Remove empty files (r53.ts, ses.ts) - **DONE**
3. Uncomment and complete infrastructure in `pulumi/icb/` OR deprecate it
4. Add deprecation notice to `pulumi/icb/` pointing users to specific projects

### Option 2: Consolidate Into Single AWS Project
Merge all AWS infrastructure into `pulumi/aws/icb/` or create a new unified project.

**Pros**:
- Single source of truth
- Easier cross-resource dependencies
- Simplified state management

**Cons**:
- Loses modularity
- Harder to manage different deployment schedules
- All resources deployed together (can't deploy OIDC separately from CDN)
- More complex rollback scenarios

### Option 3: Keep Separate + Clean Up ICB Project
- Keep `pulumi/aws/icb/`, `pulumi/aws/oidc/`, `pulumi/aws/ses/` as-is
- Either complete or deprecate `pulumi/icb/`
- Remove duplicate/unused code from `pulumi/icb/aws/`

## Decision Required

Please decide on the approach:

1. **Remove duplicate cdn.ts?** Should we delete `pulumi/icb/aws/cdn.ts` since it's superseded?
2. **Keep or deprecate icb project?** Should we:
   - Keep and complete the infrastructure in `pulumi/icb/`
   - Deprecate it in favor of focused AWS projects
   - Repurpose it for non-AWS infrastructure

3. **Project naming?** Consider renaming `pulumi/aws/icb/` to `pulumi/aws/cdn/` for clarity

## Best Practices Applied

✅ Removed empty files
✅ Standardized versions across all projects
✅ Added README documentation for each project
✅ Extracted hard-coded values to configuration
✅ Fixed VLAN conflicts in Unifi configuration
✅ Created top-level documentation

## Next Steps

1. Decide on consolidation approach
2. Remove or deprecate unused code
3. Update main README with final project structure
4. Consider adding CI/CD for automated testing
5. Set up cost monitoring for AWS resources
