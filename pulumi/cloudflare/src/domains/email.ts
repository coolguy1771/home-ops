import * as pulumi from "@pulumi/pulumi";
import * as cloudflare from "@pulumi/cloudflare";

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
