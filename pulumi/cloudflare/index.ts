import * as pulumi from "@pulumi/pulumi";
import * as cloudflare from "@pulumi/cloudflare";

//Get the zone id from the cloudflare provider
const zoneId = cloudflare.getZone({name: "my-zone.com"}).then(zone => zone.id);

// Get the ipv4 address from icanhazip.com
const ipv4 = new pulumi.asset.HttpFile("ipv4", "http://ipv4.icanhazip.com");

// Get the ipv6 address from icanhazip.com
const ipv6 = new pulumi.asset.HttpFile("ipv6", "http://ipv6.icanhazip.com");

// Create the apex ipv4 record
const ipv4Apex = new cloudflare.Record("ipv4-apex", {
    name: "ipv4",
    zoneId: zoneId,
    type: "A",
    value: ipv4,
    proxied: true,
    ttl: 3600
});

// Create the apexd ipv6 record
const ipv6Apex = new cloudflare.Record("ipv6-apex", {
    name: "ipv6",
    zoneId: zoneId,
    type: "AAAA",
    value: ipv6,
    proxied: true,
    ttl: 3600
});

// Create the root ipv4 record
const ipv4Root = new cloudflare.Record("ipv4-root", {
    name: "my-zone.com",
    zoneId: zoneId,
    type: "CNAME",
    value: "ipv4.my-zone.com",
    proxied: true,
    ttl: 3600
});

// Create the root ipv6 record
const ipv6Root = new cloudflare.Record("ipv6-root", {
    name: "my-zone.com",
    zoneId: zoneId,
    type: "CNAME",
    value: "ipv6.my-zone.com",
    proxied: true,
    ttl: 3600
});

const record = new cloudflare.Record("sample-record", {
    name: "my-record",
    zoneId: "xxsdfhsfkashadf",
    type: "A",
    value: "192.168.0.11",
    ttl: 3600
});

// Set the www record to the ipv4 address
const www = new cloudflare.Record("www", {
    name: "www",
    zoneId: zoneId,
    type: "CNAME",
    value: "ipv4.my-zone.com",
    proxied: true,
    ttl: 3600
});

// Set the WG record to the ipv4 address
const wg = new cloudflare.Record("wg", {
    name: "wg",
    zoneId: zoneId,
    type: "CNAME",
    value: "ipv4.my-zone.com",
    proxied: true,
    ttl: 3600
});

// Set the unproxied record to the ip address
const unproxied = new cloudflare.Record("unproxied", {
    name: "unproxied",
    zoneId: zoneId,
    type: "CNAME",
    value: ipv4,
    proxied: false,
    ttl: 3600
});

// Set the unproxied record to the ip address
const unproxiedIPv6 = new cloudflare.Record("unproxied", {
    name: "unproxied",
    zoneId: zoneId,
    type: "CNAME",
    value: ipv4,
    proxied: false,
    ttl: 3600
});

// Set the UpTimeRobot record to the ip address
const uptimeRobot = new cloudflare.Record("uptime-robot", {
    name: "status",
    zoneId: zoneId,
    type: "CNAME",
    value: "stats.uptimerobot.com",
    proxied: false,
    ttl: 3600
});


// Set the Page Rule to always bypass cache on plex and jellyfin
const cacheRules = new cloudflare.PageRule("cache-rule", {

    cacheLevel: "bypass",
    target: "https://plex.my-zone.com/*",
});


//   resource "cloudflare_page_rule" "public_domain_plex_bypass" {
//     zone_id  = lookup(data.cloudflare_zones.public_domain.zones[0], "id")
//     target   = "https://plex.${data.sops_file.secrets.data["cloudflare_public_domain"]}./*"
//     status   = "active"
//     priority = 1

//     actions {
//       cache_level              = "bypass"
//       rocket_loader            = "off"
//       automatic_https_rewrites = "on"
//     }
//   }

// Set the Global Zone Settings
const globalZoneSettings = new cloudflare.ZoneSettingsOverride("global-zone-settings", {
    zoneId: zoneId,
    settings: {
        alwaysOnline: "off",
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
            html: "on"
        }

    }
});

//   resource "cloudflare_zone_settings_override" "public_domain_settings" {
//     zone_id = lookup(data.cloudflare_zones.public_domain.zones[0], "id")
//     settings {
//       ssl                      = "strict"
//       always_use_https         = "on"
//       min_tls_version          = "1.2"
//       opportunistic_encryption = "on"
//       tls_1_3                  = "zrt"
//       automatic_https_rewrites = "on"
//       universal_ssl            = "on"
//       browser_check            = "on"
//       challenge_ttl            = 1800
//       privacy_pass             = "on"
//       security_level           = "medium"
//       brotli                   = "on"
//       minify {
//         css  = "on"
//         js   = "on"
//         html = "on"
//       }
//       rocket_loader       = "off"
//       always_online       = "off"
//       development_mode    = "off"
//       http3               = "on"
//       zero_rtt            = "on"
//       ipv6                = "on"
//       websockets          = "on"
//       opportunistic_onion = "on"
//       pseudo_ipv4         = "off"
//       ip_geolocation      = "on"
//       email_obfuscation   = "on"
//       server_side_exclude = "on"
//       hotlink_protection  = "off"
//       security_header {
//         enabled            = true
//         preload            = true
//         include_subdomains = true
//         nosniff            = true
//       }
//     }
//   }
