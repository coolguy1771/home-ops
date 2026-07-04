terraform {
  backend "gcs" {
    bucket = "cs-tfstate-us-east4-01cd9270ba5a4be5b1547dfd1861daa0"
    prefix = "terraform"
  }
}
