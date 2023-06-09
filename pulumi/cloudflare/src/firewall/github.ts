import * as pulumi from "@pulumi/pulumi";
import * as cloudflare from "@pulumi/cloudflare";
import { publicDomain } from "../domains/master";

export const publicDomainGithubFluxWebhookFilter = new cloudflare.Filter("publicDomainGithubFluxWebhookFilter", {
  zoneId: publicDomain.then(publicDomain => publicDomain.id),
  description: "Allow GitHub flux API",
  expression: "(ip.geoip.asnum eq 36459 and http.host eq \"flux-webhook.witl.xyz\")",
});
export const publicDomainGithubFluxWebhookFirewallRule = new cloudflare.FirewallRule("publicDomainGithubFluxWebhookFirewallRule", {
  zoneId: publicDomain.then(publicDomain => publicDomain.id),
  description: "Allow GitHub flux API",
  filterId: publicDomainGithubFluxWebhookFilter.id,
  action: "allow",
  priority: 1,
});
