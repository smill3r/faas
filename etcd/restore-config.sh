#!/bin/bash

set -e

# Wait for APISIX to be ready
echo "Waiting for APISIX to be ready..."
until curl -s -o /dev/null -w "%{http_code}" $APISIX_ADMIN_API_HOST/apisix/admin/routes -H "X-API-KEY: $APISIX_ADMIN_API_PASSWORD" | grep -q "200"; do
  echo "APISIX not ready, retrying in 5 seconds..."
  sleep 5
done

echo "APISIX is ready. Restoring configurations..."

# Restore upstreams if the file exists
if [ -f "/etcd/backups/upstreams.json" ]; then
  echo "Restoring upstreams..."
  curl -s -X PUT "$APISIX_ADMIN_API_HOST/apisix/admin/upstreams/1" \
    -H "X-API-KEY: $APISIX_ADMIN_API_PASSWORD" \
    -H "Content-Type: application/json" \
    -d @/etcd/backups/upstreams.json
fi

# Restore services if the file exists
if [ -f "/etcd/backups/services.json" ]; then
  echo "Restoring services..."
  curl -s -X PUT "$APISIX_ADMIN_API_HOST/apisix/admin/services/2" \
    -H "X-API-KEY: $APISIX_ADMIN_API_PASSWORD" \
    -H "Content-Type: application/json" \
    -d @/etcd/backups/services.json
fi

# Restore routes if the file exists
if [ -f "/etcd/backups/route_user.json" ]; then
  echo "Restoring route user..."
  curl -s -X PUT "$APISIX_ADMIN_API_HOST/apisix/admin/routes/3" \
    -H "X-API-KEY: $APISIX_ADMIN_API_PASSWORD" \
    -H "Content-Type: application/json" \
    -d @/etcd/backups/route_user.json
fi

if [ -f "/etcd/backups/route_register.json" ]; then
  echo "Restoring route auth..."
  curl -s -X PUT "$APISIX_ADMIN_API_HOST/apisix/admin/routes/4" \
    -H "X-API-KEY: $APISIX_ADMIN_API_PASSWORD" \
    -H "Content-Type: application/json" \
    -d @/etcd/backups/route_register.json
fi

if [ -f "/etcd/backups/route_function.json" ]; then
  echo "Restoring route function..."
  curl -s -X PUT "$APISIX_ADMIN_API_HOST/apisix/admin/routes/5" \
    -H "X-API-KEY: $APISIX_ADMIN_API_PASSWORD" \
    -H "Content-Type: application/json" \
    -d @/etcd/backups/route_function.json
fi

echo "Configuration restoration completed."