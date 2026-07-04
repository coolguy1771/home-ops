variable "billing_account" {
  description = "The ID of the billing account to associate projects with"
  type        = string
  default     = "01D9C3-5EAFB2-4707ED"
}

variable "org_id" {
  description = "The organization id for the associated resources"
  type        = string
  default     = "922939261149"
}

variable "billing_project" {
  description = "The project id to use for billing"
  type        = string
  default     = "cs-host-ae01b4b2d9ba40d89dd53c"
}

variable "folders" {
  description = "Folder structure as a map"
  type        = map
}

variable "cmek_autokey_folders" {
  description = "Folders for CMEK autokey encryption"
  type        = list
}
