terraform {

  backend "remote" {
    organization = "coolguy1771"
    workspaces {
      name = "home-nexus"
    }
  }

  required_providers {
    nexus = {
      source  = "datadrivers/nexus"
      version = "1.18.0"
    }
    sops = {
      source  = "carlpett/sops"
      version = "0.6.3"
    }
  }
}

data "sops_file" "nexus_secrets" {
  source_file = "secret.sops.yaml"
}

provider "nexus" {
  insecure = false
  url      = data.sops_file.nexus_secrets.data["nexus_address"]
  username = data.sops_file.nexus_secrets.data["nexus_username"]
  password = data.sops_file.nexus_secrets.data["nexus_password"]
}


resource "nexus_repository_docker_proxy" "ghcr_io_mirror" {
  name   = "ghcr-io-mirror"
  online = true

  docker {
    force_basic_auth = false
    http_port        = 0
    https_port       = 0
    v1_enabled       = true
  }

  docker_proxy {
    index_type = "REGISTRY"
  }

  http_client {
    auto_block = true
    blocked    = false
  }

  negative_cache {
    enabled = false
    ttl     = 1440
  }

  proxy {
    content_max_age  = 1440
    metadata_max_age = 1440
    remote_url       = "https://ghcr.io"

  }

  storage {
    blob_store_name                = "default"
    strict_content_type_validation = true
  }
}
resource "nexus_repository_docker_hosted" "internal" {
  name   = "internal"
  online = "true"

  docker {
    force_basic_auth = false
    v1_enabled       = false
  }

  storage {
    blob_store_name                = "default"
    strict_content_type_validation = true
    write_policy                   = "ALLOW"
  }
}

resource "nexus_repository_docker_proxy" "docker_io_mirror" {
  name   = "docker-io-mirror"
  online = true
  docker {
    force_basic_auth = false
    http_port        = 0
    https_port       = 0
    v1_enabled       = true
  }

  docker_proxy {
    index_type = "HUB"
  }

  storage {
    blob_store_name                = "default"
    strict_content_type_validation = true
  }

  proxy {
    remote_url       = "https://registry-1.docker.io"
    content_max_age  = 1440
    metadata_max_age = 1440
  }

  http_client {
    auto_block = true
    blocked    = false
  }

  negative_cache {
    enabled = false
    ttl     = 1440
  }

}
resource "nexus_security_realms" "active_realms" {
  active = [
    "NexusAuthenticatingRealm",
    "NexusAuthorizingRealm",
    "DockerToken"
  ]
}

resource "nexus_repository_docker_group" "group" {
  name   = "docker-group"
  online = true

  docker {
    force_basic_auth = false
    http_port        = 8083
    https_port       = 0
    v1_enabled       = false
  }

  group {
    member_names = [
      nexus_repository_docker_hosted.internal.name,
      nexus_repository_docker_proxy.docker_io_mirror.name,
      nexus_repository_docker_proxy.ghcr_io_mirror.name
    ]
  }

  storage {
    blob_store_name                = "default"
    strict_content_type_validation = true
  }
}