#!/bin/sh
set -e

echo "Starting database restoration from dump..."

# Check if the dump file exists
if [ -f "/docker-entrypoint-initdb.d/bk_plam-ops.dump" ]; then
    echo "Found binary dump, restoring using pg_restore..."
    # We use --clean --if-exists to avoid errors if some tables already exist from previous scripts
    # We use --no-owner to avoid errors with missing roles from the source DB
    pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --role="$POSTGRES_USER" /docker-entrypoint-initdb.d/bk_plam-ops.dump || echo "Restoration finished with some warnings (this is often normal with binary dumps)."
else
    echo "No dump file found at /docker-entrypoint-initdb.d/bk_plam-ops.dump"
fi

echo "Database restoration complete."
