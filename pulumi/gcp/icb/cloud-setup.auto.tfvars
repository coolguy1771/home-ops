org_id          = "922939261149"
billing_account = "01D9C3-5EAFB2-4707ED"

/*
The folder map is limited to three levels
The environment names are "Production", "Non Production" and "Development"
they are potentially referenced in iam.tf, service_projects.tf, and projects.tf
if you rename, e.g. "Production" to "Prod", you will need to find references like
module.cs-folders-level-1["Team 1/Production"].ids["Production"] and rename to
module.cs-folders-level-1["Team 1/Prod"].ids["Prod"]
*/
folders = {
  "Production" : {},
  "Non-Production" : {},
  "Development" : {},
}
cmek_autokey_folders = [
  {
    "folder_path" : "Production",
    "key_project_name" : "kms-key-project",
  },
  {
    "folder_path" : "Non-Production",
    "key_project_name" : "kms-key-project",
  },
  {
    "folder_path" : "Development",
    "key_project_name" : "kms-key-project",
  },
]
