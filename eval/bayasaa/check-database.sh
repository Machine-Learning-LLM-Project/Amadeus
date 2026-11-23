#!/bin/sh
# Run INSIDE an ephemeral postgres:17 container. Mount only test/source folders.
set -eu
initdb -D /tmp/amadeus-pg -A trust >/dev/null
pg_ctl -D /tmp/amadeus-pg -o '-k /tmp -c listen_addresses=' -w start >/dev/null
trap 'pg_ctl -D /tmp/amadeus-pg -m immediate stop >/dev/null' EXIT
psql -h /tmp -U postgres -v ON_ERROR_STOP=1 -f /harness/database-bootstrap.sql
psql -h /tmp -U postgres -v ON_ERROR_STOP=1 -f /migrations/20261123000100_usage_guardrails.sql
psql -h /tmp -U postgres -v ON_ERROR_STOP=1 -f /tests/usage_budget.sql
psql -h /tmp -U postgres -v ON_ERROR_STOP=1 -f /tests/usage_privacy.sql
