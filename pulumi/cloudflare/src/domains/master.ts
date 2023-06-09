import * as pulumi from "@pulumi/pulumi";
import * as cloudflare from "@pulumi/cloudflare";

export const ipv4Address = fetch("http://ipv4.icanhazip.com").then(response => response.text()).then(text => text.trim());

export const publicDomain = cloudflare.getZone({
    name: process.env.CLOUDFLARE_PUBLIC_DOMAIN!,
});

export const publicDomainApex = new cloudflare.Record("publicDomainApex", {
    name: "ipv4",
    zoneId: publicDomain.then(publicDomain => publicDomain.id),
    value: ipv4Address,
    proxied: true,
    type: "A",
    ttl: 1,
});

export const publicDomainRoot = new cloudflare.Record("publicDomainRoot", {
    name: process.env.CLOUDFLARE_PUBLIC_DOMAIN!,
    zoneId: publicDomain.then(publicDomain => publicDomain.id),
    value: `ipv4.${process.env.CLOUDFLARE_PUBLIC_DOMAIN!}`,
    proxied: true,
    type: "CNAME",
    ttl: 1,
});
export const publicDomainUptimerobot = new cloudflare.Record("publicDomainUptimerobot", {
    name: "status",
    zoneId: publicDomain.then(publicDomain => publicDomain.id),
    value: "stats.uptimerobot.com",
    proxied: false,
    type: "CNAME",
    ttl: 1,
});

export const publicDomainSettings = new cloudflare.ZoneSettingsOverride("publicDomainSettings", {
    zoneId: publicDomain.then(publicDomain => publicDomain.id),
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
        rocketLoader: "off",
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
