import * as pulumi from "@pulumi/pulumi";
import * as cloudflare from "@pulumi/cloudflare";
import { ipv4Address } from "./master";

export const icbDomain = cloudflare.getZone({
    name: "icbplays.net",
});

export const arma = new cloudflare.Record("arma", {
    name: "arma",
    zoneId: icbDomain.then(icbDomain => icbDomain.id),
    value: ipv4Address,
    proxied: false,
    type: "A",
    ttl: 1,
});
export const valheim = new cloudflare.Record("valheim", {
    name: "valheim",
    zoneId: icbDomain.then(icbDomain => icbDomain.id),
    value: ipv4Address,
    proxied: false,
    type: "A",
    ttl: 1,
});
export const icbDomainWww = new cloudflare.Record("icbDomainWww", {
    name: "www",
    zoneId: icbDomain.then(icbDomain => icbDomain.id),
    value: "ipv4.icbplays.net",
    proxied: true,
    type: "CNAME",
    ttl: 1,
});
export const icbDomainApex = new cloudflare.Record("icbDomainApex", {
    name: "ipv4",
    zoneId: icbDomain.then(icbDomain => icbDomain.id),
    value: ipv4Address,
    proxied: false,
    type: "A",
    ttl: 1,
});
export const icbDomainCfMx1 = new cloudflare.Record("icbDomainCfMx1", {
    name: "icbplays.net",
    zoneId: icbDomain.then(icbDomain => icbDomain.id),
    value: "amir.mx.cloudflare.net",
    proxied: false,
    type: "MX",
    ttl: 1,
    priority: 38,
});
export const icbDomainCfMx2 = new cloudflare.Record("icbDomainCfMx2", {
    name: "icbplays.net",
    zoneId: icbDomain.then(icbDomain => icbDomain.id),
    value: "linda.mx.cloudflare.net",
    proxied: false,
    type: "MX",
    ttl: 1,
    priority: 59,
});
export const icbDomainCfMx3 = new cloudflare.Record("icbDomainCfMx3", {
    name: "icbplays.net",
    zoneId: icbDomain.then(icbDomain => icbDomain.id),
    value: "issac.mx.cloudflare.net",
    proxied: false,
    type: "MX",
    ttl: 1,
    priority: 22,
});
export const icbDomainCfDmarc = new cloudflare.Record("icbDomainCfDmarc", {
    name: "_dmarc",
    zoneId: icbDomain.then(icbDomain => icbDomain.id),
    value: "v=DMARC1; p=none; rua=mailto:dmarc@icbplays.net",
    proxied: false,
    type: "TXT",
    ttl: 1,
});
export const icbDomainCfSpf = new cloudflare.Record("icbDomainCfSpf", {
    name: "icbplays.net",
    zoneId: icbDomain.then(icbDomain => icbDomain.id),
    value: "v=spf1 include:_spf.mx.cloudflare.net ~all",
    proxied: false,
    type: "TXT",
    ttl: 1,
});
