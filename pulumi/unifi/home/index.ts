
import * as pulumi from "@pulumi/pulumi";
import * as unifi from "@pulumiverse/unifi";

const homeSite = new unifi.Site("home-site", {
    description: "Home",
});

const mgmt = new unifi.Network("mgmt", {
  purpose: "mgmt",
  subnet: "10.1.237.1/24",
  vlanId: 1,
  dhcpStart: "10.1.237.6",
  dhcpStop: "10.0.0.254",
  dhcpEnabled: true,
});

const lab = new unifi.Network("lab", {
  purpose: "lab",
  subnet: "10.1.10.1/24",
  vlanId: 10,
  dhcpStart: "10.1.10.10",
  dhcpStop: "10.1.10.254",
  dhcpEnabled: true,
});

const wireless = new unifi.Network("wireless", {
  purpose: "wireless",
  subnet: "10.1.20.1/24",
  vlanId: 20,
  dhcpStart: "10.1.20.10",
  dhcpStop: "10.1.20.254",
  dhcpEnabled: true,
});

const guest = new unifi.Network("guest", {
  purpose: "guest",
  subnet: "10.1.30.1/24",
  vlanId: 30,
  dhcpStart: "10.1.30.10",
  dhcpStop: "10.1.30.254",
  dhcpEnabled: true,
});

const iot = new unifi.Network("iot", {
  purpose: "iot",
  subnet: "10.1.40.1/24",
  vlanId: 40,
  dhcpStart: "10.1.40.10",
  dhcpStop: "10.1.40.254",
  dhcpEnabled: true,
});


// const dynamicDNSResource = new unifi.DynamicDNS("home-ddns", {
//   hostName: "home.witl.xyz",
//   service: "string",
//   "interface": "string",
//   login: "string",
//   password: "string",
//   server: "string",
//   site: "string",
// });
