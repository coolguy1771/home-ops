#!/usr/bin/env zx
$.verbose = false
const response = await fetch('https://api.github.com/meta')
const body = await response.json()
const ips = body.hooks;
echo(ips.join(","))

// parse yaml file for ingress.annotations.nginx.ingress.kubernetes.io/whitelist-source-range: |-
helmRelease()
// if (whitelist annotation exists) { compare whitelist annotation to githubNetworks.mjs output; if different, update whitelist annotation; save file }
//if (whitelist annotation doesn't exist) { add whitelist annotation; save file }


async function helmRelease(releaseFile) {
  const helmRelease = await fs.readFile(releaseFile, 'utf8')
  const doc = YAML.parseAllDocuments(helmRelease).map((item) => item.toJS())
  const release = doc.filter((item) =>
    item.apiVersion === 'helm.toolkit.fluxcd.io/v2beta1'
      && item.kind === 'HelmRelease'
  )
  return release[0]
}
