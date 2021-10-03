# Obtain current home IP address
data "http" "ipv4" {
  url = "http://ipv4.icanhazip.com"
}

#
# Base records
#

# Record which will be updated by DDNS
resource "cloudflare_record" "apex_ipv4" {

  name    = data.sops_file.cloudflare_secrets.data["cloudflare_domain"]
  zone_id = lookup(data.cloudflare_zones.domain.zones[0], "id")
  value   = "ipv4.${data.sops_file.cloudflare_secrets.data["cloudflare_domain"]}"
  proxied = true
  type    = "CNAME"
  ttl     = 1
}

resource "cloudflare_record" "apex_root" {
  name    = "@"
  zone_id = lookup(data.cloudflare_zones.domain.zones[0], "id")
  value   = chomp(data.http.ipv4.body)
  proxied = true
  type    = "A"
  ttl     = 1
}

resource "cloudflare_record" "cname_www" {
  name    = "www"
  zone_id = lookup(data.cloudflare_zones.domain.zones[0], "id")
  value   = "ipv4.${data.sops_file.cloudflare_secrets.data["cloudflare_domain"]}"
  proxied = true
  type    = "CNAME"
  ttl     = 1
}

#
# Mailjet
#


resource "cloudflare_record" "mailjet_txt" {
  name    = "mailjet._074f3d2a"
  zone_id = lookup(data.cloudflare_zones.domain.zones[0], "id")
  value   = "074f3d2a3705b557579d988cbe5691f2"
  proxied = false
  type    = "TXT"
  ttl     = 1
}

resource "cloudflare_record" "txt_spf" {
  name    = data.sops_file.cloudflare_secrets.data["cloudflare_domain"]
  zone_id = lookup(data.cloudflare_zones.domain.zones[0], "id")
  value   = "v=spf1 include:spf.mailjet.com ?all"
  proxied = false
  type    = "TXT"
  ttl     = 1
}

#
# Additional email records
#

resource "cloudflare_record" "txt_domainkey" {
  name    = "mailjet._domainkey"
  zone_id = lookup(data.cloudflare_zones.domain.zones[0], "id")
  value   = "k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCsVd9b3HzLBEj57pFAaqNeOCsvupcrG6eUWZ605N0O2BbjyT75fSyGueZsSPzRSETKLbFLTqrK1UeVRiogeBR4vKuXX3070/G6DM4Zh2+mqC3PTX0lsTiKhY4x/2EDsf3y33qVPLvWZoDToKVdt4GkE3O9GjHLvVL0rRVqA86OCwIDAQAB"
  proxied = false
  type    = "TXT"
  ttl     = 1
}
