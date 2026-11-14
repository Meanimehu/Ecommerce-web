#!/usr/bin/env bash
# Test only: runs the end-to-end specs against a running local backend, one spec file at a time (Document 7,
# section 11). The backend allows a computer address 20 login codes an hour, so the backend's login-code table is
# emptied before each file, as in local runs. It refuses any database that is not on this machine.
#
#   E2E_BACKEND_LOG=... E2E_DATABASE_URL=postgres://user:pass@localhost:5432/db scripts/e2e-with-backend.sh chromium-phone
set -euo pipefail

project="${1:?usage: scripts/e2e-with-backend.sh <playwright project>}"
: "${E2E_BACKEND_LOG:?E2E_BACKEND_LOG must name the log file of the backend}"
: "${E2E_DATABASE_URL:?E2E_DATABASE_URL must name the test database}"
case "$E2E_DATABASE_URL" in
  *@localhost:* | *@localhost/* | *@127.0.0.1:* | *@127.0.0.1/*) ;;
  *) echo "Refusing: E2E_DATABASE_URL is not a database on this machine." >&2; exit 2 ;;
esac

failed=()
for spec in tests/e2e/*.spec.ts; do
  name="$(basename "$spec" .spec.ts)"
  psql "$E2E_DATABASE_URL" --quiet --command 'delete from otp_requests'
  if ! PLAYWRIGHT_HTML_OUTPUT_DIR="playwright-report/$name" \
    npx playwright test "$spec" --project="$project" --output="test-results/$name"; then
    failed+=("$name")
  fi
done

if [ "${#failed[@]}" -gt 0 ]; then
  echo "Failed specs on $project: ${failed[*]}" >&2
  exit 1
fi
echo "All specs passed on $project."
