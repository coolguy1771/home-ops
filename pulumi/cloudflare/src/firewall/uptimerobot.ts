import * as pulumi from "@pulumi/pulumi";
import * as cloudflare from "@pulumi/cloudflare";
import { publicDomain } from "../domains/master";

export const uptimerobotIPs = fetch("https://uptimerobot.com/inc/files/ips/IPv4.txt").then(response => response.text()).then(body => body.split("\n"))

// export const uptimerobotList = new cloudflare.List("uptimerobotList", {
//     accountId: publicDomain.then(publicDomain => publicDomain.id),
//     name: "uptimerobot",
//     kind: "ip",
//     description: "List of UptimeRobot IP Addresses",
//     dynamic: [{
//         forEach: uptimerobotIPs,
//         content: [{
//             value: [{
//                 ip: item.value,
//             }],
//         }],
//     }],
// });

// export const uptimerobotFilter = new cloudflare.Filter("uptimerobotFilter", {
//     zoneId: publicDomain.then(publicDomain => publicDomain.id),
//     description: "Expression to allow UptimeRobot IP addresses",
//     expression: `(ip.src in $uptimerobot)`,
// }, {
//     dependsOn: [uptimerobotList],
// });
// export const uptimerobotFirewallRule = new cloudflare.FirewallRule("uptimerobotFirewallRule", {
//     zoneId: publicDomain.then(publicDomain => publicDomain.id),
//     description: "Firewall rule to allow UptimeRobot IP addresses",
//     filterId: uptimerobotFilter.id,
//     action: "allow",
// });
