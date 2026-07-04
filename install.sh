#!/usr/bin/env bash
set -euo pipefail

: "${GRAFANA_CLOUD_API_TOKEN:?Set GRAFANA_CLOUD_API_TOKEN before running this script}"

helm repo add grafana https://grafana.github.io/helm-charts &&
    helm repo update &&
    helm upgrade --install --version ^2 --atomic --timeout 300s grafana-k8s-monitoring grafana/k8s-monitoring \
        --namespace "monitoring" --create-namespace --values - <<EOF
cluster:
  name: kyak
destinations:
  - name: grafana-cloud-metrics
    type: prometheus
    url: https://prometheus-prod-13-prod-us-east-0.grafana.net/api/prom/push
    auth:
      type: basic
      username: "1847040"
      password: ${GRAFANA_CLOUD_API_TOKEN}
  - name: grafana-cloud-logs
    type: loki
    url: https://logs-prod-006.grafana.net/loki/api/v1/push
    auth:
      type: basic
      username: "1022805"
      password: ${GRAFANA_CLOUD_API_TOKEN}
  - name: grafana-cloud-traces
    type: otlp
    url: https://tempo-prod-04-prod-us-east-0.grafana.net:443
    protocol: grpc
    auth:
      type: basic
      username: "1017120"
      password: ${GRAFANA_CLOUD_API_TOKEN}
    metrics:
      enabled: false
    logs:
      enabled: false
    traces:
      enabled: true
  - name: grafana-cloud-profiles
    type: pyroscope
    url: https://profiles-prod-001.grafana.net:443
    auth:
      type: basic
      username: "1065026"
      password: ${GRAFANA_CLOUD_API_TOKEN}
clusterMetrics:
  enabled: true
  opencost:
    enabled: true
    metricsSource: grafana-cloud-metrics
    opencost:
      exporter:
        defaultClusterId: kyak
      prometheus:
        existingSecretName: grafana-cloud-metrics-grafana-k8s-monitoring
        external:
          url: https://prometheus-prod-13-prod-us-east-0.grafana.net/api/prom
  kepler:
    enabled: true
annotationAutodiscovery:
  enabled: true
prometheusOperatorObjects:
  enabled: true
clusterEvents:
  enabled: true
podLogs:
  enabled: true
applicationObservability:
  enabled: true
  receivers:
    otlp:
      grpc:
        enabled: true
        port: 4317
      http:
        enabled: true
        port: 4318
    zipkin:
      enabled: true
      port: 9411
  connectors:
    grafanaCloudMetrics:
      enabled: true
autoInstrumentation:
  enabled: true
profiling:
  enabled: true
alloy-metrics:
  enabled: true
  alloy:
    extraEnv:
      - name: GCLOUD_RW_API_KEY
        valueFrom:
          secretKeyRef:
            name: alloy-metrics-remote-cfg-grafana-k8s-monitoring
            key: password
      - name: CLUSTER_NAME
        value: kyak
      - name: NAMESPACE
        valueFrom:
          fieldRef:
            fieldPath: metadata.namespace
      - name: POD_NAME
        valueFrom:
          fieldRef:
            fieldPath: metadata.name
      - name: GCLOUD_FM_COLLECTOR_ID
        value: grafana-k8s-monitoring-\$(CLUSTER_NAME)-\$(NAMESPACE)-\$(POD_NAME)
  remoteConfig:
    enabled: true
    url: https://fleet-management-prod-008.grafana.net
    auth:
      type: basic
      username: "1065026"
      password: ${GRAFANA_CLOUD_API_TOKEN}
alloy-singleton:
  enabled: true
  alloy:
    extraEnv:
      - name: GCLOUD_RW_API_KEY
        valueFrom:
          secretKeyRef:
            name: alloy-singleton-remote-cfg-grafana-k8s-monitoring
            key: password
      - name: CLUSTER_NAME
        value: kyak
      - name: NAMESPACE
        valueFrom:
          fieldRef:
            fieldPath: metadata.namespace
      - name: POD_NAME
        valueFrom:
          fieldRef:
            fieldPath: metadata.name
      - name: GCLOUD_FM_COLLECTOR_ID
        value: grafana-k8s-monitoring-\$(CLUSTER_NAME)-\$(NAMESPACE)-\$(POD_NAME)
  remoteConfig:
    enabled: true
    url: https://fleet-management-prod-008.grafana.net
    auth:
      type: basic
      username: "1065026"
      password: ${GRAFANA_CLOUD_API_TOKEN}
alloy-logs:
  enabled: true
  alloy:
    extraEnv:
      - name: GCLOUD_RW_API_KEY
        valueFrom:
          secretKeyRef:
            name: alloy-logs-remote-cfg-grafana-k8s-monitoring
            key: password
      - name: CLUSTER_NAME
        value: kyak
      - name: NAMESPACE
        valueFrom:
          fieldRef:
            fieldPath: metadata.namespace
      - name: POD_NAME
        valueFrom:
          fieldRef:
            fieldPath: metadata.name
      - name: NODE_NAME
        valueFrom:
          fieldRef:
            fieldPath: spec.nodeName
      - name: GCLOUD_FM_COLLECTOR_ID
        value: grafana-k8s-monitoring-\$(CLUSTER_NAME)-\$(NAMESPACE)-alloy-logs-\$(NODE_NAME)
  remoteConfig:
    enabled: true
    url: https://fleet-management-prod-008.grafana.net
    auth:
      type: basic
      username: "1065026"
      password: ${GRAFANA_CLOUD_API_TOKEN}
alloy-receiver:
  enabled: true
  alloy:
    extraPorts:
      - name: otlp-grpc
        port: 4317
        targetPort: 4317
        protocol: TCP
      - name: otlp-http
        port: 4318
        targetPort: 4318
        protocol: TCP
      - name: zipkin
        port: 9411
        targetPort: 9411
        protocol: TCP
    extraEnv:
      - name: GCLOUD_RW_API_KEY
        valueFrom:
          secretKeyRef:
            name: alloy-receiver-remote-cfg-grafana-k8s-monitoring
            key: password
      - name: CLUSTER_NAME
        value: kyak
      - name: NAMESPACE
        valueFrom:
          fieldRef:
            fieldPath: metadata.namespace
      - name: POD_NAME
        valueFrom:
          fieldRef:
            fieldPath: metadata.name
      - name: NODE_NAME
        valueFrom:
          fieldRef:
            fieldPath: spec.nodeName
      - name: GCLOUD_FM_COLLECTOR_ID
        value: grafana-k8s-monitoring-\$(CLUSTER_NAME)-\$(NAMESPACE)-alloy-receiver-\$(NODE_NAME)
  remoteConfig:
    enabled: true
    url: https://fleet-management-prod-008.grafana.net
    auth:
      type: basic
      username: "1065026"
      password: ${GRAFANA_CLOUD_API_TOKEN}
alloy-profiles:
  enabled: true
  alloy:
    extraEnv:
      - name: GCLOUD_RW_API_KEY
        valueFrom:
          secretKeyRef:
            name: alloy-profiles-remote-cfg-grafana-k8s-monitoring
            key: password
      - name: CLUSTER_NAME
        value: kyak
      - name: NAMESPACE
        valueFrom:
          fieldRef:
            fieldPath: metadata.namespace
      - name: POD_NAME
        valueFrom:
          fieldRef:
            fieldPath: metadata.name
      - name: NODE_NAME
        valueFrom:
          fieldRef:
            fieldPath: spec.nodeName
      - name: GCLOUD_FM_COLLECTOR_ID
        value: grafana-k8s-monitoring-\$(CLUSTER_NAME)-\$(NAMESPACE)-alloy-profiles-\$(NODE_NAME)
  remoteConfig:
    enabled: true
    url: https://fleet-management-prod-008.grafana.net
    auth:
      type: basic
      username: "1065026"
      password: ${GRAFANA_CLOUD_API_TOKEN}
EOF
