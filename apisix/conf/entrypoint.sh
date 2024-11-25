#!/bin/bash

set -e

apisix start &

# Wait for APISIX to be ready
echo "Waiting for APISIX to be ready..."
until curl -s -o /dev/null -w "%{http_code}" $APISIX_ADMIN_API_HOST/apisix/admin/routes -H "X-API-KEY: $APISIX_ADMIN_API_PASSWORD" | grep -q "200"; do
  echo "APISIX not ready, retrying in 5 seconds..."
  sleep 5
done

adc sync -f adc.yaml

#envsubst < adc-ssl.yaml > adc-ssl-processed.yaml
#adc sync -f adc-ssl-processed.yaml -f adc.yaml

tail -f /dev/null