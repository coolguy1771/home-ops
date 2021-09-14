# `flux-system` Namespace

I am using [flux2](https://github.com/fluxcd/flux2) to automate management of the cluster and setting the cluster state as defined in this repository. All items below are actually in the flux-system namespace, but unable to reside in the [flux-system](/flux-system) directory due to some issues with Kustomize.

## discord-alerts

![FluxBot Alert](https://i.imgur.com/XRnEra4.png)

Basic discord alerts from flux to my private discord channel.

* [notifications/discord/notification.yaml](notifications/discord/notification.yaml) - Defines the alerts that are valid for discord
* [notifications/discord/notification.yaml](notifications/discord/notification.yaml) - Defines where the alerts go and via what path
* [notifications/discord/secret.sops.yaml](notifications/discord/secret.sops.yaml) - My encrypted secret for the discord webhook

## github-alerts

![GitHub Commit Alert](https://i.imgur.com/06rhLWP.png)

* [notifications/github/notification.yaml](notifications/github/notification.yaml) - Defines the alerts that are valid for github
* [notifications/github/notification.yaml](notifications/github/notification.yaml) - Defines where the alerts go and via what path
* [notifications/github/notification.yaml/secret.sops.yaml](notifications/github/notification.yaml/secret.sops.yaml) - My encrypted secret for the github api token

## helm-chart-repositories

A yaml for each of the chart repositories used by HelmReleases in this repo.

## monitoring

* [monitoring/flux-pod-monitor.yaml](monitoring/pod-monitor.yaml) - PodMonitors to export metrics from Flux to Prometheus for use in Grafana
