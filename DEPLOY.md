# Deploying elitehealthandsafety.co.uk

IONOS **Deploy Now is not in use** (platform outage). Deployment runs through
**GitHub Actions** instead: `.github/workflows/deploy.yml`.

## How it runs

| Trigger | When |
|---|---|
| Push to `main` | every code change |
| Manual | Actions tab → *Deploy to IONOS* → *Run workflow* |
| Nightly 03:00 UTC | picks up **price changes made in the portal** with no code change |

Each run: installs → syncs live pricing from the portal → builds → refuses to
deploy if fewer than 20 pages or `.htaccess` is missing → backs up the live
docroot (keeps the last 10) → `rsync --delete` → verifies six URLs and that the
compliance checklist has not regressed to the old email gate → **rolls back
automatically if verification fails**.

## One-time setup — repo secrets

Settings → Secrets and variables → Actions → *New repository secret*:

| Secret | Value |
|---|---|
| `SSH_PRIVATE_KEY` | contents of `~/.ssh/ehs_ionos` (the whole file, including the BEGIN/END lines) |
| `SSH_HOST` | `access-5019528687.webspace-host.com` |
| `SSH_USER` | `su41679` |
| `DEPLOY_PATH` | `/home/www/clickandbuilds/Elitehealthandsafety` |
| `SUPABASE_URL` | `https://txkfuodkrssvafxyeskg.supabase.co` |
| `SUPABASE_SERVICE_KEY` | Supabase → Project Settings → API → `service_role` |

Without the two Supabase secrets the site still builds and deploys — it just
uses the committed price snapshot instead of pulling fresh from the portal.

## Manual deploy (fallback)

```bash
bash scripts/deploy.sh
```

Same steps from your machine. Git Bash has no `rsync`, so it uploads a tarball
and runs `rsync` server-side.

## Rollback

```bash
ssh -i ~/.ssh/ehs_ionos su41679@access-5019528687.webspace-host.com \
  'D=/home/www/clickandbuilds/Elitehealthandsafety; \
   LATEST=$(ls -1t /home/www/_backups/site-predeploy-*.tar.gz | head -1); \
   rm -rf $D/*; tar xzf $LATEST -C $D; echo restored $LATEST'
```

## Notes

- `public/.htaccess` is **in this repo** and deploys with the site. It carries
  `DirectoryIndex`, gzip and cache headers. Do not edit it on the server only —
  the next deploy overwrites it.
- Prices are **never** edited here. They are set in the portal (Subscription
  builder → Service catalogue); the site follows. See `src/data/pricing.js`.
