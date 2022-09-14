terraform {

  backend "remote" {
    organization = "onedr0p"
    workspaces {
      name = "home-cloudflare"
    }
  }

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "3.22.0"
    }
    http = {
      source  = "hashicorp/http"
      version = "3.1.0"
    }
    sops = {
      source  = "carlpett/sops"
      version = "0.7.1"
    }
  }
}

data "sops_file" "cloudflare_secrets" {
  source_file = "secret.sops.yaml"
}

provider "cloudflare" {
  email   = data.sops_file.cloudflare_secrets.data["cloudflare_email"]
  api_key = data.sops_file.cloudflare_secrets.data["cloudflare_apikey"]
}

data "cloudflare_zones" "domain_xyz" {
  filter {
    name = data.sops_file.cloudflare_secrets.data["cloudflare_domain_xyz"]
  }
}

data "cloudflare_zones" "domain_net" {
  filter {
    name = data.sops_file.cloudflare_secrets.data["cloudflare_domain_net"]
  }
}

data "cloudflare_zones" "domain_studio" {
  filter {
    name = data.sops_file.cloudflare_secrets.data["cloudflare_domain_studio"]
  }
}

data "cloudflare_zones" "domain_co" {
  filter {
    name = data.sops_file.cloudflare_secrets.data["cloudflare_domain_co"]
  }
}
