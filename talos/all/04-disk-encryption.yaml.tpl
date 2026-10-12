{{- $noTPM := hasKey .Node.Data "noTPM" -}}
# slot 0 (nodeID) is left exactly as already enrolled — permanent recovery
# key if TPM sealing ever breaks (BIOS update changes PCRs, fTPM cleared,
# SecureBoot toggled). TPM slot needs the signed PCR policy key that ships
# only in the -secureboot image.
#
# checkSecurebootOnEnroll is intentionally NOT set yet: enroll happens as
# each node is upgraded, before its firmware SecureBoot is turned on. Add it
# in a later pass once every node reports securitystate.secureBoot=true.
#
# allowDiscards passes TRIM through LUKS so the default weekly
# FilesystemTrimConfig can reach the SSDs (takes effect on next reboot).
{{- range $volume := list "STATE" "EPHEMERAL" }}
---
apiVersion: v1alpha1
kind: VolumeConfig
name: {{ $volume }}
encryption:
  provider: luks2
  allowDiscards: true
  keys:
    - nodeID: {}
      slot: 0
{{- if not $noTPM }}
    - tpm: {}
      slot: 1
{{- end }}
{{- if eq $volume "EPHEMERAL" }}
mount:
  secure: true # nosuid,nodev on /var (takes effect on next reboot)
{{- end }}
{{- end }}
