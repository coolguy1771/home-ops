module "cs-common" {
  source  = "terraform-google-modules/folders/google"
  version = "~> 5.0"

  parent = "organizations/${var.org_id}"
  names = [
    "Common",
  ]
}

locals {
  folders_level_1 = compact(flatten([for parent, children in var.folders : length(children) == 0 ?
  [] : [for child, _ in children : join("/", [parent, child])]]))

  # this level is not needed for all resource hierarchies
  folders_level_2 = compact(flatten([for parent, children in var.folders : length(children) == 0 ?
    [] : [for child, grandchildren in children : length(grandchildren) == 0 ?
  [] : [for grandchild, _ in grandchildren : join("/", [parent, child, grandchild])]]]))

  # path to folder resource map
  # this map is used to reference folder from the correct module, such as
  # {
  #   "Team 1" => module.cs-folders-level-0["Team 1"]
  #   "Team 1/Production" => module.cs-folders-level-1["Team 1/Production"]
  #   "Team 1/Production/Department 1" => module.cs-folders-level-2["Team 1/Production/Department 1"]
  # }
  folder_map = merge(
    { "Common" = module.cs-common },
    { for k, v in var.folders : k => module.cs-folders-level-0[k] },
    { for path in local.folders_level_1 : path => module.cs-folders-level-1[path] },
    { for path in local.folders_level_2 : path => module.cs-folders-level-2[path] }
  )
}

module "cs-folders-level-0" {
  source  = "terraform-google-modules/folders/google"
  version = "~> 5.0"

  for_each = var.folders
  parent   = "organizations/${var.org_id}"
  names    = each.key[*]
}

module "cs-folders-level-1" {
  /*
folder ids from this module are referenced with a full path and a
folder name, such as
`module.cs-folders-level-1["Production/folder-at-level-2"].id`
*/
  source  = "terraform-google-modules/folders/google"
  version = "~> 5.0"

  for_each = toset(local.folders_level_1)
  parent   = module.cs-folders-level-0[element(split("/", each.value), 0)].id
  names    = [element(split("/", each.value), 1)]
}

module "cs-folders-level-2" {
  /*
this module is not needed for all resource hierarchies
folder ids from this module are referenced with a full path and a
folder name, such
as`module.cs-folders-level-2["Production/folder-at-level-2/folder-at-level-3"].id`
*/
  source  = "terraform-google-modules/folders/google"
  version = "~> 5.0"

  for_each = toset(local.folders_level_2)
  parent   = module.cs-folders-level-1[join("/", slice(split("/", each.value), 0, 2))].id
  names    = [element(split("/", each.value), 2)]
}
