import * as pulumi from "@pulumi/pulumi";
import * as cloudflare from "@pulumi/cloudflare";
import { publicDomain } from "../domains/master";
//
// GeoIP blocking
//
export const countriesFilter = new cloudflare.Filter("countriesFilter", {
  zoneId: publicDomain.then(publicDomain => publicDomain.id),
  description: "Expression to block all countries except US, CA, GB and AU",
  expression: "(ip.geoip.country ne \"US\" and ip.geoip.country ne \"CA\" and ip.geoip.country ne \"GB\" and ip.geoip.country ne \"AU\")",
});
export const countriesFirewallRule = new cloudflare.FirewallRule("countriesFirewallRule", {
  zoneId: publicDomain.then(publicDomain => publicDomain.id),
  description: "Firewall rule to block all countries except US, CA, GB, and AU",
  filterId: countriesFilter.id,
  action: "block",
});
