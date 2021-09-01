# Networking

My current cluster-internal networking is implemented by {{ links.external('calico') }}.

| Name                        | CIDR              |
| --------------------------- | ----------------- |
| Management                  | `192.168.1.0/24`  |
| Servers                     | `10.10.10.0/24` |
| k8s pods                    | `10.69.0.0/16`    |
| k8s services                | `10.96.0.0/16`    |


## Exposing services on their own IP address



Most (http/https) traffic enters my cluster through an Ingress controller. For situations where this is not desirable (e.g. MQTT traffic) or when I need a fixed IP reachable from outside the cluster (e.g. to use in combination with port forwarding).

Using this setup I can define a Service to use a Load Balancer with `externalIPs`, and it will be exposed on my network on that given IP address.

### Mixed-protocol services

I have enabled the `MixedProtocolLBService=true` feature-gate on my cluster. This means that I can combine UDP and TCP ports on the same Service.
