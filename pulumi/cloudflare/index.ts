import * as pulumi from "@pulumi/pulumi";
import * as cloudflare from "@pulumi/cloudflare";

export async function getIpv4Address() {
  return await fetch("http://ipv4.icanhazip.com").then(response => response.text()).then(text => text.trim());
}


const ipv4Address = getIpv4Address().then(ipv4Address => ipv4Address)

pulumi.log.debug(`IPV4 Address: ${ipv4Address}`)


// Get the CF zone for the public domain
export const publicDomain = cloudflare.getZone({
  name: process.env.CLOUDFLARE_PUBLIC_DOMAIN,
});

// Get the CF zone ID for the public domain
export async function getCFZoneID(domainName: string) {
  return await cloudflare.getZone({
    name: domainName,
  }).then(domain => domain.zoneId)
}

export const publicDomainApex = new cloudflare.Record("publicDomainApex", {
    name: "ipv4",
    zoneId: getCFZoneID(process.env.CLOUDFLARE_PUBLIC_DOMAIN!),
    value: getIpv4Address(),
    proxied: true,
    type: "A",
    ttl: 1,
});

export const publicDomainRoot = new cloudflare.Record("publicDomainRoot", {
    name: "@" ,
    zoneId: getCFZoneID(process.env.CLOUDFLARE_PUBLIC_DOMAIN!),
    value: `ipv4.${process.env.CLOUDFLARE_PUBLIC_DOMAIN}`,
    proxied: true,
    type: "CNAME",
    ttl: 1,
});

export const publicDomainUptimerobot = new cloudflare.Record("publicDomainUptimerobot", {
    name: "status",
    zoneId: getCFZoneID(process.env.CLOUDFLARE_PUBLIC_DOMAIN!),
    value: "stats.uptimerobot.com",
    proxied: false,
    type: "CNAME",
    ttl: 1,
});

export const publicDomainHome = new cloudflare.Record("publicDomainHome", {
    name: "home",
    zoneId: getCFZoneID(process.env.CLOUDFLARE_PUBLIC_DOMAIN!),
    value: getIpv4Address(),
    proxied: false,
    type: "A",
    ttl: 1,
});

export const publicDomainMXRecord1 = new cloudflare.Record("publicDomainMXRecord1", {
  name: process.env.CLOUDFLARE_PUBLIC_DOMAIN!,
  zoneId: getCFZoneID(process.env.CLOUDFLARE_PUBLIC_DOMAIN!),
  value: "mx01.mail.icloud.com",
  proxied: false,
  type: "MX",
  priority: 10,
  ttl: 3600,
});

export const publicDomainMXRecord2 = new cloudflare.Record("publicDomainMXRecord2", {
  name: process.env.CLOUDFLARE_PUBLIC_DOMAIN!,
  zoneId: getCFZoneID(process.env.CLOUDFLARE_PUBLIC_DOMAIN!),
  value: "mx02.mail.icloud.com",
  proxied: false,
  type: "MX",
  priority: 10,
  ttl: 3600,
});

export const publicDomainDmarc = new cloudflare.Record("publicDomainDmarc", {
  name: "_dmarc",
  zoneId: getCFZoneID(process.env.CLOUDFLARE_PUBLIC_DOMAIN!),
  value: `v=DMARC1; p=quarantine; rua=mailto:e987809bfe034ac695b485ae84eb0752@dmarc-reports.cloudflare.net,mailto:dmarc@${process.env.CLOUDFLARE_PUBLIC_DOMAIN}`,
  proxied: false,
  type: "TXT",
  ttl: 3600,
});

export const publicDomainDomainKey = new cloudflare.Record("publicDomainDomainKey", {
  name: "sig1._domainkey",
  zoneId: getCFZoneID(process.env.CLOUDFLARE_PUBLIC_DOMAIN!),
  value: `sig1.dkim.${process.env.CLOUDFLARE_PUBLIC_DOMAIN!}.at.icloudmailadmin.com`,
  proxied: false,
  type: "CNAME",
  ttl: 3600,
});


export const publicDomainAppleTxt = new cloudflare.Record("publicDomainAppleTxt", {
  name: process.env.CLOUDFLARE_PUBLIC_DOMAIN!,
  zoneId: getCFZoneID(process.env.CLOUDFLARE_PUBLIC_DOMAIN!),
  value: "apple-domain=RUE9sWDVAZHi8pN6",
  proxied: false,
  type: "TXT",
  ttl: 3600,
});

export const publicDomainSPF = new cloudflare.Record("publicDomainSPF", {
  name: process.env.CLOUDFLARE_PUBLIC_DOMAIN!,
  zoneId: getCFZoneID(process.env.CLOUDFLARE_PUBLIC_DOMAIN!),
  value: "v=spf1 include:icloud.com ~all",
  proxied: false,
  type: "TXT",
  ttl: 3600,
});


export const publicDomainSettings = new cloudflare.ZoneSettingsOverride("publicDomainSettings", {
    zoneId: getCFZoneID(process.env.CLOUDFLARE_PUBLIC_DOMAIN!),
    settings: {
        ssl: "strict",
        alwaysUseHttps: "on",
        minTlsVersion: "1.2",
        opportunisticEncryption: "on",
        tls13: "zrt",
        automaticHttpsRewrites: "on",
        universalSsl: "on",
        browserCheck: "on",
        challengeTtl: 1800,
        privacyPass: "on",
        securityLevel: "medium",
        brotli: "on",
        minify: {
            css: "on",
            js: "on",
            html: "on",
        },
        rocketLoader: "on",
        alwaysOnline: "off",
        developmentMode: "off",
        http3: "on",
        zeroRtt: "on",
        ipv6: "on",
        websockets: "on",
        opportunisticOnion: "on",
        pseudoIpv4: "off",
        ipGeolocation: "on",
        emailObfuscation: "on",
        serverSideExclude: "on",
        hotlinkProtection: "off",
        securityHeader: {
            enabled: true,
            preload: true,
            includeSubdomains: true,
            nosniff: true,
        },
    },
});

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

export const emailDomain = cloudflare.getZone({
  name: "286k.co",
});

export const emailDomainFastmailCname1 = new cloudflare.Record("emailDomainFastmailCname1", {
  name: "fm1._domainkey",
  zoneId: emailDomain.then(emailDomain => emailDomain.id),
  value: "fm1.286k.co.dkim.fmhosted.com",
  proxied: false,
  type: "CNAME",
  ttl: 1,
});
export const emailDomainFastmailCname2 = new cloudflare.Record("emailDomainFastmailCname2", {
  name: "fm2._domainkey",
  zoneId: emailDomain.then(emailDomain => emailDomain.id),
  value: "fm2.286k.co.dkim.fmhosted.com",
  proxied: false,
  type: "CNAME",
  ttl: 1,
});
export const emailDomainFastmailCname3 = new cloudflare.Record("emailDomainFastmailCname3", {
  name: "fm3._domainkey",
  zoneId: emailDomain.then(emailDomain => emailDomain.id),
  value: "fm3.286k.co.dkim.fmhosted.com",
  proxied: false,
  type: "CNAME",
  ttl: 1,
});

export const emailDomainFastmailMx1 = new cloudflare.Record("emailDomainFastmailMx1", {
  name: "286k.co",
  zoneId: emailDomain.then(emailDomain => emailDomain.id),
  value: "in1-smtp.messagingengine.com",
  proxied: false,
  type: "MX",
  ttl: 1,
  priority: 10,
});
export const emailDomainFastmailMx2 = new cloudflare.Record("emailDomainFastmailMx2", {
  name: "286k.co",
  zoneId: emailDomain.then(emailDomain => emailDomain.id),
  value: "in2-smtp.messagingengine.com",
  proxied: false,
  type: "MX",
  ttl: 1,
  priority: 20,
});

export const emailDomainFastmailSpf = new cloudflare.Record("emailDomainFastmailSpf", {
  name: "286k.co",
  zoneId: emailDomain.then(emailDomain => emailDomain.id),
  value: "v=spf1 include:spf.messagingengine.com ?all",
  proxied: false,
  type: "TXT",
  ttl: 1,
});

export const emailDomainFastmailDmarc = new cloudflare.Record("emailDomainFastmailDmarc", {
  name: "_dmarc",
  zoneId: emailDomain.then(emailDomain => emailDomain.id),
  value: `v=DMARC1; p=none; rua=mailto:${process.env.CLOUDFLARE_EMAIL}`,
  proxied: false,
  type: "TXT",
  ttl: 1,
});

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

pulumi.log.info("Finished creating resources");
