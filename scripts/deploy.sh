#!/usr/bin/env bash
# Manual deploy — same steps as .github/workflows/deploy.yml, for when you need
# to push the site live from this machine instead of via GitHub Actions.
#
#   bash scripts/deploy.sh
#
# Prefer the Actions workflow: it runs on every push and verifies + rolls back.
set -euo pipefail

KEY="${SSH_KEY:-$HOME/.ssh/ehs_ionos}"
HOST="${SSH_HOST:-access-5019528687.webspace-host.com}"
USER="${SSH_USER:-su41679}"
DOCROOT="${DEPLOY_PATH:-/home/www/clickandbuilds/Elitehealthandsafety}"
SITE="${SITE_URL:-https://elitehealthandsafety.co.uk}"
SSH="ssh -i $KEY -o BatchMode=yes"

[ -f "$KEY" ] || { echo "No SSH key at $KEY"; exit 1; }

echo "==> Building (syncs live pricing from the portal first)"
npm run build

pages=$(find dist -name index.html | wc -l)
[ -f dist/.htaccess ] || { echo "dist/.htaccess missing — aborting"; exit 1; }
[ "$pages" -ge 20 ] || { echo "only $pages pages built — aborting"; exit 1; }
echo "    $pages pages, .htaccess present"

echo "==> Backing up the live site"
$SSH "$USER@$HOST" "set -e
  B=/home/www/_backups; mkdir -p \$B
  tar czf \$B/site-predeploy-\$(date +%Y%m%d-%H%M%S).tar.gz -C '$DOCROOT' .
  ls -1t \$B/site-predeploy-*.tar.gz | tail -n +11 | xargs -r rm --
  ls -1t \$B/site-predeploy-*.tar.gz | head -1"

echo "==> Syncing"
if command -v rsync >/dev/null 2>&1; then
  rsync -az --delete --checksum -e "$SSH" dist/ "$USER@$HOST:$DOCROOT/"
else
  # Git Bash on Windows ships no rsync. Upload a tarball and let the server —
  # which does have rsync — do the same delete-aware sync into the docroot.
  echo "    (no local rsync — using tar upload + server-side rsync)"
  tar czf .deploy.tar.gz -C dist .
  scp -i "$KEY" -o BatchMode=yes .deploy.tar.gz "$USER@$HOST:~/deploy.tar.gz" >/dev/null
  rm -f .deploy.tar.gz
  $SSH "$USER@$HOST" "set -e
    rm -rf ~/deploy_stage && mkdir -p ~/deploy_stage
    tar xzf ~/deploy.tar.gz -C ~/deploy_stage
    rsync -a --delete ~/deploy_stage/ '$DOCROOT/'
    rm -rf ~/deploy_stage ~/deploy.tar.gz
    echo '    server-side sync done'"
fi

echo "==> Verifying"
fail=0
for p in / /pricing/ /compliance-checklist/ /contact-us/ /blog/ /services/; do
  code=$(curl -s -o /dev/null --max-time 25 -w "%{http_code}" "$SITE$p")
  printf "    %-26s %s\n" "$p" "$code"
  [ "$code" = "200" ] || fail=1
done
if curl -s --max-time 25 "$SITE/compliance-checklist/" | grep -q "Send me the checklist"; then
  echo "    !! checklist is gated again"; fail=1
fi

if [ "$fail" != "0" ]; then
  echo "==> FAILED. Roll back with:"
  echo "    $SSH $USER@$HOST 'LATEST=\$(ls -1t /home/www/_backups/site-predeploy-*.tar.gz | head -1); rm -rf $DOCROOT/*; tar xzf \$LATEST -C $DOCROOT'"
  exit 1
fi
echo "==> Live and verified."
