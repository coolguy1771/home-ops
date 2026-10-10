{{- if .Node.Data.iface }}
apiVersion: v1alpha1
kind: DHCPv4Config
name: {{ .Node.Data.iface }}
---
apiVersion: v1alpha1
kind: LinkConfig
name: {{ .Node.Data.iface }}
mtu: 1500
{{- end }}
