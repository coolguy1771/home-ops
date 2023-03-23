data "cloudflare_zones" "icb_domain" {
  filter {
    name = "icbplays.net"
  }
}

resource "cloudflare_record" "arma" {
  name    = "arma"
  zone_id = lookup(data.cloudflare_zones.icb_domain.zones[0], "id")
  value   = chomp(data.http.ipv4.response_body)
  proxied = false
  type    = "A"
  ttl     = 1
}

resource "cloudflare_record" "valheim" {
  name    = "valheim"
  zone_id = lookup(data.cloudflare_zones.icb_domain.zones[0], "id")
  value   = chomp(data.http.ipv4.response_body)
  proxied = false
  type    = "A"
  ttl     = 1
}

resource "cloudflare_record" "icb_domain_www" {
  name    = "www"
  zone_id = lookup(data.cloudflare_zones.icb_domain.zones[0], "id")
  value   = "ipv4.icbplays.net"
  proxied = true
  type    = "CNAME"
  ttl     = 1
}

resource "cloudflare_record" "icb_domain_apex" {
  name    = "ipv4"
  zone_id = lookup(data.cloudflare_zones.icb_domain.zones[0], "id")
  value   = chomp(data.http.ipv4.response_body)
  proxied = false
  type    = "A"
  ttl     = 1
}

resource "cloudflare_record" "icb_domain_cf_mx1" {
  name     = "icbplays.net"
  zone_id  = lookup(data.cloudflare_zones.icb_domain.zones[0], "id")
  value    = "amir.mx.cloudflare.net"
  proxied  = false
  type     = "MX"
  ttl      = 1
  priority = 38
}

resource "cloudflare_record" "icb_domain_cf_mx2" {
  name     = "icbplays.net"
  zone_id  = lookup(data.cloudflare_zones.icb_domain.zones[0], "id")
  value    = "linda.mx.cloudflare.net"
  proxied  = false
  type     = "MX"
  ttl      = 1
  priority = 59
}
resource "cloudflare_record" "icb_domain_cf_mx3" {
  name     = "icbplays.net"
  zone_id  = lookup(data.cloudflare_zones.icb_domain.zones[0], "id")
  value    = "issac.mx.cloudflare.net"
  proxied  = false
  type     = "MX"
  ttl      = 1
  priority = 22
}


resource "cloudflare_record" "icb_domain_cf_dmarc" {
  name    = "_dmarc"
  zone_id = lookup(data.cloudflare_zones.icb_domain.zones[0], "id")
  value   = "v=DMARC1; p=none; rua=mailto:dmac@icbplays.net"
  proxied = false
  type    = "TXT"
  ttl     = 1
}

resource "cloudflare_record" "icb_domain_cf_spf" {
  name    = "icbplays.net"
  zone_id = lookup(data.cloudflare_zones.icb_domain.zones[0], "id")
  value   = "v=spf1 include:_spf.mx.cloudflare.net ~all"
  proxied = false
  type    = "TXT"
  ttl     = 1
}
