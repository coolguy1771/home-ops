module "cs-org-policy-storage_publicAccessPrevention" {
  source  = "terraform-google-modules/org-policy/google//modules/org_policy_v2"
  version = "~> 5.2"

  policy_root      = "organization"
  policy_root_id   = var.org_id
  constraint       = "storage.publicAccessPrevention"
  policy_type      = "boolean"
  exclude_folders  = []
  exclude_projects = []

  rules = [
    {
      enforcement = true
      allow       = []
      deny        = []
      conditions  = []
  }, ]
}

module "cs-org-policy-compute_requireOsLogin" {
  source  = "terraform-google-modules/org-policy/google//modules/org_policy_v2"
  version = "~> 5.2"

  policy_root      = "organization"
  policy_root_id   = var.org_id
  constraint       = "compute.requireOsLogin"
  policy_type      = "boolean"
  exclude_folders  = []
  exclude_projects = []

  rules = [
    {
      enforcement = true
      allow       = []
      deny        = []
      conditions  = []
  }, ]
}

module "cs-org-policy-compute_vmExternalIpAccess" {
  source  = "terraform-google-modules/org-policy/google//modules/org_policy_v2"
  version = "~> 5.2"

  policy_root      = "organization"
  policy_root_id   = var.org_id
  constraint       = "compute.vmExternalIpAccess"
  policy_type      = "list"
  exclude_folders  = []
  exclude_projects = []

  rules = [
    {
      enforcement = true
      allow       = []
      deny        = []
      conditions  = []
  }, ]
}

module "cs-org-policy-compute_disableNestedVirtualization" {
  source  = "terraform-google-modules/org-policy/google//modules/org_policy_v2"
  version = "~> 5.2"

  policy_root      = "organization"
  policy_root_id   = var.org_id
  constraint       = "compute.disableNestedVirtualization"
  policy_type      = "boolean"
  exclude_folders  = []
  exclude_projects = []

  rules = [
    {
      enforcement = true
      allow       = []
      deny        = []
      conditions  = []
  }, ]
}

module "cs-org-policy-compute_disableSerialPortAccess" {
  source  = "terraform-google-modules/org-policy/google//modules/org_policy_v2"
  version = "~> 5.2"

  policy_root      = "organization"
  policy_root_id   = var.org_id
  constraint       = "compute.disableSerialPortAccess"
  policy_type      = "boolean"
  exclude_folders  = []
  exclude_projects = []

  rules = [
    {
      enforcement = true
      allow       = []
      deny        = []
      conditions  = []
  }, ]
}

module "cs-org-policy-sql_restrictAuthorizedNetworks" {
  source  = "terraform-google-modules/org-policy/google//modules/org_policy_v2"
  version = "~> 5.2"

  policy_root      = "organization"
  policy_root_id   = var.org_id
  constraint       = "sql.restrictAuthorizedNetworks"
  policy_type      = "boolean"
  exclude_folders  = []
  exclude_projects = []

  rules = [
    {
      enforcement = true
      allow       = []
      deny        = []
      conditions  = []
  }, ]
}

module "cs-org-policy-sql_restrictPublicIp" {
  source  = "terraform-google-modules/org-policy/google//modules/org_policy_v2"
  version = "~> 5.2"

  policy_root      = "organization"
  policy_root_id   = var.org_id
  constraint       = "sql.restrictPublicIp"
  policy_type      = "boolean"
  exclude_folders  = []
  exclude_projects = []

  rules = [
    {
      enforcement = true
      allow       = []
      deny        = []
      conditions  = []
  }, ]
}

module "cs-org-policy-compute_restrictXpnProjectLienRemoval" {
  source  = "terraform-google-modules/org-policy/google//modules/org_policy_v2"
  version = "~> 5.2"

  policy_root      = "organization"
  policy_root_id   = var.org_id
  constraint       = "compute.restrictXpnProjectLienRemoval"
  policy_type      = "boolean"
  exclude_folders  = []
  exclude_projects = []

  rules = [
    {
      enforcement = true
      allow       = []
      deny        = []
      conditions  = []
  }, ]
}

module "cs-org-policy-compute_skipDefaultNetworkCreation" {
  source  = "terraform-google-modules/org-policy/google//modules/org_policy_v2"
  version = "~> 5.2"

  policy_root      = "organization"
  policy_root_id   = var.org_id
  constraint       = "compute.skipDefaultNetworkCreation"
  policy_type      = "boolean"
  exclude_folders  = []
  exclude_projects = []

  rules = [
    {
      enforcement = true
      allow       = []
      deny        = []
      conditions  = []
  }, ]
}

module "cs-org-policy-compute_disableVpcExternalIpv6" {
  source  = "terraform-google-modules/org-policy/google//modules/org_policy_v2"
  version = "~> 5.2"

  policy_root      = "organization"
  policy_root_id   = var.org_id
  constraint       = "compute.disableVpcExternalIpv6"
  policy_type      = "boolean"
  exclude_folders  = []
  exclude_projects = []

  rules = [
    {
      enforcement = true
      allow       = []
      deny        = []
      conditions  = []
  }, ]
}
