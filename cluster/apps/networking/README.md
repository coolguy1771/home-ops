# `networking` Namespace

## Authentik

[Authentik](https://goauthentik.io) is an open-source Identity Provider focused on flexibility and versatility

* [authentik/helm-release.yaml](authentikhelm-release.yaml) - HelmRelease for Authentik

## Cloudflare-DDNS

A cron job that uses a script to udpate a dns reocord pointing to the cluster's external IP address.

* [cloudflare-ddns/cron-job.yaml](cloudflare-ddns/cron-job.yaml) - Cron Job which schedules the DNS update
* [cloudflare-ddns/secret.sops.yaml](cloudflare-ddns/secret.sops.yaml) - Secret holding the Cloudflare API key

## Error-Pages

[Error-Pages](https://github.com/tarampampam/error-pages) A Static server error pages in a docker image

* [error-pages/helm-release.yaml](error-pages/helm-release.yaml) - HelmRelease for Error-Pages
* [error-pages/ingress-route.yaml](error-pages/ingress-route.yaml) - Custom ingress route
* [error-pages/middleware.yaml](error-pages/middleware.yaml) - Custom Traefik middleware

## External-DNS

[External-DNS](https://github.com/kubernetes-sigs/external-dns) Configures external DNS servers (AWS Route53, Google CloudDNS and others) for Kubernetes Ingresses and Services

* [external-dns/helm-release.yaml](external-dns/helm-release.yaml) - HelmRelease for External-DNS

## Traefik

[Traefik](https://traefik.io) is a modern HTTP reverse proxy and load balancer that makes deploying microservices easy. Traefik integrates with your existing infrastructure components and configures itself automatically and dynamically.

* [traefik/helm-release.yaml](traefik/helm-release.yaml) - HelmRelease for Traefik
* [traefik/prometheus-rule.yaml](traefik/prometheus-rule.yaml) - Custom Prometheus monitoring rules
* [traefik/service-monitor.yaml](traefik/service-monitor.yaml) - Custom service monitor
* [traefik/middlewares](traefik/middlewares/) - Hold all of the middlewares for Traefik
* [traefik/dashboard/ingress.yaml](traefik/dashboard/ingress.yaml) - Holds custom ingress for dashboard

## Unifi

[Unifi Controller](https://github.com/jacobalberty/unifi-docker) is Ubiquiti Network's Unifi Controller

* [unifi/helm-release.yaml](unifi/helm-release.yaml) - HelmRelease for Unifi

## Wildcard-Certificate

Uses Cert-Manager to generate a wildcard certificate for a domain

* [wildcard-certificate/blackelement.yaml](wildcard-certificate/blackelement.yaml) - Cerificate for Black Element Studio
* [wildcard-certificate/certificate.yaml](wildcard-certificate/certificate.yaml) - Certificate for Main Domain
* [wildcard-certificate/icb.yaml](wildcard-certificate/icb.yaml) - Certificicate for Intercontinental Bufoonery
