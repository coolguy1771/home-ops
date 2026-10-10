{{- $noTPM := hasKey .Node.Data "noTPM" -}}
machine:
  systemDiskEncryption:
    # slot 0 (nodeID) is left exactly as already enrolled — permanent recovery
    # key if TPM sealing ever breaks (BIOS update changes PCRs, fTPM cleared,
    # SecureBoot toggled). TPM slot needs the signed PCR policy key that ships
    # only in the -secureboot image.
    #
    # checkSecurebootOnEnroll is intentionally NOT set yet: enroll happens as
    # each node is upgraded, before its firmware SecureBoot is turned on. Add it
    # in a later pass once every node reports securitystate.secureBoot=true.
    ephemeral:
      provider: luks2
      keys:
        - nodeID: {}
          slot: 0
{{- if not $noTPM }}
        - tpm: {}
          slot: 1
{{- end }}
    state:
      provider: luks2
      keys:
        - nodeID: {}
          slot: 0
{{- if not $noTPM }}
        - tpm: {}
          slot: 1
{{- end }}
