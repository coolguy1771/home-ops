import * as pulumi from "@pulumi/pulumi";
import * as cloudflare from "@pulumi/cloudflare";
import { publicDomain } from "../domains/master";
//
// Bots
//
export const botsFilter = new cloudflare.Filter("botsFilter", {
  zoneId: publicDomain.then(publicDomain => publicDomain.id),
  description: "Expression to block bots determined by CF",
  expression: "(cf.client.bot) or (cf.threat_score gt 14)",
});
export const botsFirewallRule = new cloudflare.FirewallRule("botsFirewallRule", {
  zoneId: publicDomain.then(publicDomain => publicDomain.id),
  description: "Firewall rule to block bots determined by CF",
  filterId: botsFilter.id,
  action: "block",
});
