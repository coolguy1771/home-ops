#!/usr/bin/env bash

set -o nounset
set -o errexit

FILE_DATE=$(date "+%Y%m%d-%H%M%S")

curl --silent -k --user "${OPNSENSE_KEY}":"${OPNSENSE_SECRET}" https://"${OPNSENSE_HOST}"/api/backup/backup/download --output "opnsense-backup-${FILE_DATE}.xml"
FILE="opnsense-backup-${FILE_DATE}.xml"

RESOURCE="/${S3_BUCKET}/${FILE}"
CONTENT_TYPE="text/xml"
DATE=$(date -R)
_signature="PUT\n\n${CONTENT_TYPE}\n${DATE}\n${RESOURCE}"
SIGNATURE=$(echo -en "${_signature}" | openssl sha1 -hmac "${S3_SECRET_KEY}" -binary | base64)

curl --silent -X PUT -T "${FILE}" \
        -H "Host: ${S3_ENDPOINT}" \
        -H "Date: ${DATE}" \
        -H "Content-Type: ${CONTENT_TYPE}" \
        -H "Authorization: AWS ${S3_ACCESS_KEY}:${SIGNATURE}" \
        https://"${S3_ENDPOINT}""${RESOURCE}"
