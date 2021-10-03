#
# GeoIP blocking
#

resource "cloudflare_filter" "countries" {
  zone_id     = lookup(data.cloudflare_zones.domain.zones[0], "id")
  description = "Expression to block all countries except US"
  expression  = "(ip.geoip.country ne \"US\")"
}

resource "cloudflare_firewall_rule" "countries" {
  zone_id     = lookup(data.cloudflare_zones.domain.zones[0], "id")
  description = "Firewall rule to block all countries except US"
  filter_id   = cloudflare_filter.countries.id
  action      = "block"
}

#
# Allow CF approved Bots
#
resource "cloudflare_filter" "bots" {
  zone_id     = lookup(data.cloudflare_zones.domain.zones[0], "id")
  description = "Expression to allow Cloudflare approved bots"
  expression  = "(cf.client.bot)"

}

resource "cloudflare_firewall_rule" "bots" {
  zone_id     = lookup(data.cloudflare_zones.domain.zones[0], "id")
  description = "Firewall rule allow Cloudflare approved bots"
  filter_id   = cloudflare_filter.bots.id
  action      = "allow"
}
