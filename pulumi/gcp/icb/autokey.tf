# Create the key projects
module "cs-kms-projects" {
  source  = "terraform-google-modules/project-factory/google"
  version = "~> 18.0"

  for_each = {
    for v in var.cmek_autokey_folders :
    v.folder_path => v
  }

  org_id            = var.org_id
  folder_id         = trimprefix(local.folder_map[each.key].id, "folders/")
  name              = each.value.key_project_name
  project_id        = "kms-proj"
  random_project_id = true
  billing_account   = var.billing_account
  activate_apis     = ["cloudkms.googleapis.com"]
}

# Create KMS Service Agents
resource "google_project_service_identity" "kms_service_agent" {
  for_each = {
    for v in var.cmek_autokey_folders :
    v.folder_path => v
  }

  provider = google-beta
  service  = "cloudkms.googleapis.com"
  project  = module.cs-kms-projects[each.key].project_id
}

# Grant the KMS Service Agent the Cloud KMS Admin roles
resource "google_project_iam_member" "autokey_project_admin" {
  provider = google-beta

  for_each = {
    for v in var.cmek_autokey_folders :
    v.folder_path => v
  }

  project = module.cs-kms-projects[each.key].project_id
  role    = "roles/cloudkms.admin"
  member  = "serviceAccount:service-${module.cs-kms-projects[each.key].project_number}@gcp-sa-cloudkms.iam.gserviceaccount.com"
}

module "cs-autokey" {
  source  = "terraform-google-modules/kms/google//modules/autokey"
  version = "~> 3.1"
  for_each = {
    for v in var.cmek_autokey_folders :
    v.folder_path => v
  }
  project_id            = module.cs-kms-projects[each.key].project_id
  autokey_folder_number = trimprefix(local.folder_map[each.key].id, "folders/")
}

module "autokey-org-policy-gcp-restrict-on-cmek-services" {
  source  = "terraform-google-modules/org-policy/google//modules/org_policy_v2"
  version = "~> 7.0"
  for_each = {
    for v in var.cmek_autokey_folders :
    v.folder_path => v
  }
  policy_root      = "folder"
  policy_root_id   = trimprefix(local.folder_map[each.key].id, "folders/")
  constraint       = "gcp.restrictNonCmekServices"
  policy_type      = "list"
  exclude_folders  = []
  exclude_projects = []
  rules = [
    {
      enforcement = null
      allow       = []
      deny = [
        "aiplatform.googleapis.com",
        "alloydb.googleapis.com",
        "apigee.googleapis.com",
        "artifactregistry.googleapis.com",
        "bigquery.googleapis.com",
        "bigquerydatatransfer.googleapis.com",
        "bigtable.googleapis.com",
        "cloudfunctions.googleapis.com",
        "cloudtasks.googleapis.com",
        "composer.googleapis.com",
        "compute.googleapis.com",
        "container.googleapis.com",
        "dataflow.googleapis.com",
        "dataform.googleapis.com",
        "datafusion.googleapis.com",
        "dataplex.googleapis.com",
        "dataproc.googleapis.com",
        "discoveryengine.googleapis.com",
        "documentai.googleapis.com",
        "eventarc.googleapis.com",
        "file.googleapis.com",
        "firestore.googleapis.com",
        "integrations.googleapis.com",
        "logging.googleapis.com",
        "looker.googleapis.com",
        "notebooks.googleapis.com",
        "pubsub.googleapis.com",
        "redis.googleapis.com",
        "run.googleapis.com",
        "secretmanager.googleapis.com",
        "securesourcemanager.googleapis.com",
        "spanner.googleapis.com",
        "speech.googleapis.com",
        "sqladmin.googleapis.com",
        "storage.googleapis.com",
        "storagetransfer.googleapis.com",
        "workstations.googleapis.com",
      ]
      conditions = []
    }
  ]
}

module "autokey-org-policy-gcp-restrict-cmek-crypto-key-projects" {
  source  = "terraform-google-modules/org-policy/google//modules/org_policy_v2"
  version = "~> 7.0"
  for_each = {
    for v in var.cmek_autokey_folders :
    v.folder_path => v
  }
  policy_root      = "folder"
  policy_root_id   = trimprefix(local.folder_map[each.key].id, "folders/")
  constraint       = "gcp.restrictCmekCryptoKeyProjects"
  policy_type      = "list"
  exclude_folders  = []
  exclude_projects = []
  rules = [
    {
      enforcement = null
      allow = [
        "projects/${module.cs-kms-projects[each.key].project_id}"
      ]
      deny       = []
      conditions = []
    }
  ]
}
