terraform {
  cloud {
    hostname     = "app.terraform.io"
    organization = "coolguy1771"
    workspaces {
      name = "arpa-home-cloudflare"
    }
  }
  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "3.32.0"
    }
    http = {
      source  = "hashicorp/http"
      version = "3.2.1"
    }
  }
  required_version = ">= 1.3.0"
}

provider "cloudflare" {
  email   = var.cloudflare_email
  api_key = var.cloudflare_apikey
}
