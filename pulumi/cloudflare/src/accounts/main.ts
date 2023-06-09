import * as pulumi from "@pulumi/pulumi";
import * as cloudflare from "@pulumi/cloudflare";

export const Main = new cloudflare.Account("main", {
  name: "My main Cloudflare Account",
  type: "standard",
  enforceTwofactor: true,
});

export const ipv4Address = fetch("http://ipv4.icanhazip.com").then(response => response.text()).then(text => text.trim());

