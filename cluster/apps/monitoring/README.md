# `monitoring` Namespace

Provides configuration for all the monitoring applications used on the cluster.

## Botkube

![BotKube Discord Message](https://i.imgur.com/UhuC0k9.png)

[botkube](https://www.botkube.io/) provides richer integration with multiple chat clients for alerts and cluster management if desired. This configuration is using discord for the alerting.

- [botkube/helm-release.yaml](botkube/helm-values) - HelmRelease for Botkube

## Grafana

[Grafana](https://grafana.com/) is the dashboarding software backed by Prometheus, InfluxDB, and others for visualizing metrics and data.

- [grafana/helm-release](grafana/helm-release.yaml) - HelmRelease for Grafana

## kube-prometheus-stack

[kube-prometheus-stack](https://github.com/prometheus-community/helm-charts/tree/main/charts/kube-prometheus-stack) installs Prometheus Operator, required CRDs, and a default altering ruleset.

- [kube-prometheus-stack/helm-release.yaml](kube-prometheus-stack/helm-release.yaml) - HelmRelease for kube-prometheus-stack

## Thanos

[Thanos](https://github.com/thanos-io/thanos) is a highly available Prometheus setup with long term storage capabilities (backed by [minio](../default/minio/) in this case).

- [thanos/helm-release.yaml](thanos/helm-release.yaml) - HelmRelease for Thanos

## Loki

[Loki](https://grafana.com/oss/loki) is a horizontally-scalable, highly-available, multi-tenant log aggregation system inspired by Prometheus. It is designed to be very cost effective and easy to operate. It does not index the contents of the logs, but rather a set of labels for each log stream.

- [loki/helm-release.yaml](loki/helm-release.yaml) - HemRelease for Loki

## Promtail

[Promtail](https://grafana.com/oss/loki/) is an agent which ships the contents of local logs to a Loki instance

- [promtail/helm-release.yaml](promtail/helm-release.yaml) - HemRelease for Promtail

## Speedtest-Exporter

[Speedtest-Exporter](https://github.com/MiguelNdeCarvalho/speedtest-exporter/) is a Speedtest Exporter made in python using the official speedtest bin

- [speedtest-exporter/helm-release.yaml](speedtest-exporter/helm-release.yaml) - HemRelease for Speedtest-Exporter

## Unifi-Poller

[Unifi-Poller](https://unpoller.com) Collects your UniFi controller data and report it to an InfluxDB instance, or export it for Prometheus collection.

- [unifi-poller/helm-release.yaml](unifi-poller/helm-release.yaml) - HemRelease for Unifi-Poller
