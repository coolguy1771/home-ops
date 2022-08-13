#!/usr/bin/env bash

set -o nounset
set -o errexit

config_filename="$(date "+%Y%m%d-%H%M%S").xml"
http_request_date=$(date -R)
http_filepath="${S3_BUCKET}/${config_filename}"
sig="PUT\n\ntext/xml\n${http_request_date}\n/${http_filepath}"
http_signature=$(echo -en "${sig}" | openssl sha1 -hmac "${AWS_SECRET_ACCESS_KEY}" -binary | base64)

echo "Download Opnsense config file ..."
curl -fsSLk \
        --user "${OPNSENSE_KEY}:${OPNSENSE_SECRET}" \
        --output "${config_filename}" \
        "https://${OPNSENSE_HOST}/api/backup/backup/download"

echo "Upload backup to s3 bucket ..."
curl -fsSL \
        -X PUT -T "${config_filename}" \
        -H "Host: ${S3_ENDPOINT}" \
        -H "Date: ${http_request_date}" \
        -H "Content-Type: text/xml" \
        -H "Authorization: AWS ${AWS_ACCESS_KEY_ID}:${http_signature}" \
        "https://${S3_ENDPOINT}/${http_filepath}"
