set quiet := true
set shell := ['bash', '-euo', 'pipefail', '-c']

talos_dir := justfile_dir() + '/talos'
controller := `talosctl config info -o yaml | yq -e '.endpoints[0]'`

export TOPFCONFIG := justfile_dir() + '/talos/topf.yaml'

[private]
default:
    just -l talos

[doc('Apply Talos + Kubernetes config to the cluster [args=extra topf flags]')]
apply *args:
    topf apply {{ args }}

[doc('Apply Talos config to a single node [NODE=required]')]
apply-node node *args:
    topf apply --nodes-filter "^{{ node }}$" {{ args }}

[doc('Download Talos machine image')]
download-image version schematic:
    gum spin --title "Downloading Talos {{ version }} ..." -- \
    curl -sfL --remove-on-error --retry 5 --retry-delay 5 --retry-all-errors \
        -o "{{ talos_dir }}/talos-{{ version }}-{{ replace_regex(schematic, '^(.{8}).*', '$1') }}.iso" \
        "https://factory.talos.dev/image/{{ schematic }}/{{ version }}/metal-amd64.iso"
    just log info "Downloaded Talos" version "{{ version }}" schematic "{{ schematic }}"

[doc('Generate the admin kubeconfig')]
kubeconfig:
    topf kubeconfig > "{{ justfile_dir() }}/kubeconfig"

[doc('Reboot a node')]
reboot-node node:
    gum confirm "Reboot node {{ node }}?" --default="No" && \
        talosctl -n {{ node }} reboot -m powercycle || exit 0

[doc('Render Talos configs for inspection (writes to talos/output/)')]
render *args:
    topf render {{ args }}

[doc('Reset a node [NODE=required]')]
reset-node node:
    gum confirm "Reset node {{ node }}?" --default="No" && \
        topf reset --nodes-filter "^{{ node }}$" || exit 0

[doc('Print resolved schematic IDs for all nodes')]
schematic-ids *args:
    topf schematic-ids {{ args }}

[doc('Shutdown a node')]
shutdown-node node:
    gum confirm "Shutdown node {{ node }}?" --default="No" && \
        talosctl -n "{{ node }}" shutdown --force || exit 0

[doc('Generate the talosconfig')]
talosconfig:
    topf talosconfig > "{{ justfile_dir() }}/talosconfig"

[doc('Upgrade Kubernetes version on the cluster [VERSION=required, then update kubernetesVersion in topf.yaml]')]
upgrade-k8s version:
    talosctl -n "{{ controller }}" upgrade-k8s --to {{ version }}

[doc('Upgrade Talos on nodes to the version pinned in topf.yaml [NODE=optional]')]
upgrade-node node="":
    topf upgrade {{ if node != "" { "--nodes-filter=^" + node + "$" } else { "" } }}
