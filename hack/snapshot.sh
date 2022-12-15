#!/usr/bin/env bash

# while read -r line; do declare -x "$line"; done < <(sops -d ./kubernetes/flux/vars/cluster-secrets.sops.yaml | yq eval '.stringData' - | sed 's/: /=/g')
# while read -r line; do declare -x "$line"; done < <(yq eval '.data' ./kubernetes/flux/vars/cluster-settings.yaml | sed 's/: /=/g')

# # envsubst < ./kubernetes/apps/home-automation/home-assistant/helmrelease.yaml
# envsubst < <(cat "${1}") | kubectl apply -f -


# query="$(kubectl -n default get deployment,statefulset --selector="app.kubernetes.io/name=plex" --no-headers 2>&1)"
# if echo "${query}" | grep -q "No resources"; then
#     echo "Controller not found in cluster"
# else
#     echo "${query}" | awk '{print $1}'
# fi

# query="$(kubectl -n default get persistentvolumeclaim --selector="app.kubernetes.io/name=plex" --no-headers 2>&1)"
# if echo "${query}" | grep -q "No resources"; then
#     echo "Claim not found in cluster"
# else
#     echo "${query}" | awk '{print $1}'
# fi

# query="$(kubectl -n default get helmrelease plex -o yaml 2>&1)"
# if echo "${query}" | grep -q "NotFound"; then
#     echo "Kustomization not found in cluster"
# else
#     echo "${query}" | yq eval '.metadata.labels."kustomize.toolkit.fluxcd.io/name"'
# fi


while true; do
  if kubectl wait --for=condition=complete --timeout=0 job/name 2>/dev/null; then
    job_result=0
    break
  fi

  if kubectl wait --for=condition=failed --timeout=0 job/name 2>/dev/null; then
    job_result=1
    break
  fi

  sleep 3
done

if [[ $job_result -eq 1 ]]; then
    echo "Job failed!"
    exit 1
fi

echo "Job succeeded"
