resource "kubernetes_secret_v1" "kopia" {
  metadata {
    name      = "kopia"
    namespace = "default"
    labels = {
      "app.arpa.home/name" = "kopia"
    }
  }
  data = {
    "repository.config" = "${templatefile(
      "${path.module}/templates/repository.config.tftpl", {
        b2_app_key    = data.sops_file.secrets.data["kopia_b2_app_key"],
        b2_app_key_id = data.sops_file.secrets.data["kopia_b2_app_key_id"]
      }
    )}"
  }
}

resource "kubernetes_stateful_set_v1" "kopia" {
  metadata {
    name      = "kopia"
    namespace = "default"
    labels = {
      "app.arpa.home/name" = "kopia"
    }
  }
  spec {
    selector {
      match_labels = {
        "app.arpa.home/name" = "kopia"
      }
    }
    service_name = "kopia"
    replicas     = 1
    template {
      metadata {
        labels = {
          "app.arpa.home/name" = "kopia"
        }
      }
      spec {
        init_container {
          name  = "config"
          image = "public.ecr.aws/docker/library/busybox:latest"
          command = [
            "/bin/sh",
            "-c",
            "cp /config/repository.config /app/config/repository.config"
          ]
          volume_mount {
            name       = "kopia-config"
            mount_path = "/app/config"
          }
          volume_mount {
            name       = "kopia-config-tmp"
            mount_path = "/config"
            read_only  = true
          }
        }
        container {
          name              = "main"
          image             = "docker.io/kopia/kopia:0.13.0"
          image_pull_policy = "IfNotPresent"
          env {
            name  = "KOPIA_PASSWORD"
            value = data.sops_file.secrets.data["kopia_repository_password"]
          }
          env {
            name  = "TZ"
            value = "America/New_York"
          }
          args = [
            "server",
            "start",
            "--insecure",
            "--address",
            "0.0.0.0:51515",
            "--override-hostname",
            "osiris.286k.co",
            "--override-username",
            "twitlin",
            "--without-password",
            "--metrics-listen-addr",
            "0.0.0.0:51516"
          ]
          port {
            name           = "http"
            container_port = 51515
            host_port      = 51515
          }
          port {
            name           = "metrics"
            container_port = 51516
            host_port      = 51516
          }
          liveness_probe {
            http_get {
              path = "/"
              port = 51515
            }
            initial_delay_seconds = 30
            period_seconds        = 30
            failure_threshold     = 6
            timeout_seconds       = 10
          }
          readiness_probe {
            http_get {
              path = "/"
              port = 51515
            }
            initial_delay_seconds = 30
            period_seconds        = 30
            failure_threshold     = 6
            timeout_seconds       = 10
          }
          security_context {
            privileged  = true
            run_as_user = 0
          }
          volume_mount {
            name       = "kopia-cache"
            mount_path = "/app/cache"
          }
          volume_mount {
            name       = "kopia-logs"
            mount_path = "/app/logs"
          }
          volume_mount {
            name       = "kopia-config"
            mount_path = "/app/config"
          }
          volume_mount {
            name       = "data"
            mount_path = "/pluto"
            read_only  = true
          }
          resources {
            requests = {
              cpu    = "4"
              memory = "8Gi"
            }
            limits = {
              cpu    = "4"
              memory = "8Gi"
            }
          }
        }
        volume {
          name = "kopia-logs"
          empty_dir {}
        }
        volume {
          name = "kopia-config"
          empty_dir {}
        }
        volume {
          name = "kopia-config-tmp"
          projected {
            default_mode = "0420"
            sources {
              secret {
                name = "kopia"
              }
            }
          }
        }
        volume {
          name = "data"
          host_path {
            path = "/pluto"
          }
        }
        toleration {
          effect   = "NoSchedule"
          operator = "Exists"
        }
      }
    }
    update_strategy {
      type = "RollingUpdate"
    }
    volume_claim_template {
      metadata {
        name = "kopia-cache"
      }
      spec {
        access_modes       = ["ReadWriteOnce"]
        storage_class_name = "local-path"

        resources {
          requests = {
            storage = "5Gi"
          }
        }
      }
    }
  }
}

resource "kubernetes_service_v1" "kopia" {
  metadata {
    name      = "kopia"
    namespace = "default"
    labels = {
      "app.arpa.home/name" = "kopia"
    }
  }
  spec {
    selector = {
      "app.arpa.home/name" = "kopia"
    }
    port {
      name        = "http"
      port        = 51515
      target_port = 51515
      protocol    = "TCP"
    }
    port {
      name        = "metrics"
      port        = 51516
      target_port = 51516
      protocol    = "TCP"
    }
  }
}

resource "kubernetes_ingress_v1" "kopia" {
  metadata {
    name      = "kopia"
    namespace = "default"
    annotations = {
      "traefik.ingress.kubernetes.io/router.entrypoints" = "web"
    }
    labels = {
      "app.arpa.home/name" = "kopia"
    }
  }
  spec {
    ingress_class_name = "traefik"
    rule {
      host = "kopia.286k.co"
      http {
        path {
          path      = "/"
          path_type = "Prefix"
          backend {
            service {
              name = "kopia"
              port {
                number = 51515
              }
            }
          }
        }
      }
    }
  }
}
