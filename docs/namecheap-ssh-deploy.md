# Namecheap production deploy over SSH

Automates `docs/deployment-runbook.md`'s manual process (backup, upload,
install, Passenger restart) through a single, access-controlled GitHub
Actions workflow: `.github/workflows/namecheap-deploy.yml`. Built 26
November 2026, authorized by the owner after they enabled SSH access in
Namecheap's cPanel and configured the secrets below.

## One-time setup the owner must complete (I have no tool access to do this)

### 1. Move the SSH secrets into a protected `production` Environment

Currently `NAMECHEAP_SSH_PRIVATE_KEY`, `NAMECHEAP_SSH_PASSPHRASE`,
`NAMECHEAP_SSH_HOST`, `NAMECHEAP_SSH_USER` and `NAMECHEAP_SSH_PORT` are
**repository-level** secrets, which any workflow on any branch could in
principle read if manually triggered by someone with write access. To
actually restrict them to protected, main-branch-only deploys (requirement
#8), move them to an Environment:

1. GitHub → this repo → **Settings** → **Environments** → **New environment**.
2. Name it exactly `production` (the workflow's `environment: production`
   lines reference this name).
3. Under **Deployment branches and tags**, choose **Selected branches and
   tags** → add `main` only. This is what makes GitHub itself refuse to run
   either job unless the triggering ref is `main` — enforced by GitHub, not
   by the workflow's own `if:` conditions, which are a second, independent
   layer.
4. Optional but recommended for extra safety on `deploy` runs specifically:
   add yourself as a **required reviewer** on the environment, so every
   deploy needs a manual approval click in the Actions UI even after CI
   passes.
5. Under this environment's own **Environment secrets**, add the same 5
   secrets (same names, same values) you already set at the repository
   level. Once they exist here, you may remove the repository-level copies
   — the workflow only ever reads `secrets.NAMECHEAP_SSH_*` and GitHub
   resolves that to the environment-scoped value automatically whenever a
   job declares `environment: production`.

Until this is done, both jobs will still run (GitHub auto-creates an
unrestricted `production` environment the first time a workflow references
one that doesn't exist yet), but without the branch restriction a
`workflow_dispatch` run from any branch could use the secrets. Do this
before ever running `mode: deploy`.

### 2. Nothing else to configure

Host key pinning, the connectivity test, backup, deploy, restart, health
check and rollback are all already implemented in the workflow and need no
further setup.

## How to run it

GitHub → **Actions** → **Namecheap production deploy** → **Run workflow**.

**Every run, always**, first executes `connectivity-test` — read-only,
makes no changes anywhere, safe to run as often as you like from any
branch. It prints (to the run's job summary): the account's identity,
`node`/`npm` versions on `PATH`, any `~/nodevenv` entries, candidate
`server.js`/`.next` locations, running `node` processes, and disk space.
**Use its output to fill in `app_path` and (if needed) `activate_cmd`
before ever setting `mode: deploy`.**

To actually deploy:
- `mode`: `deploy`
- `app_path`: the exact absolute path `connectivity-test` confirmed (e.g.
  `/home/youraccount/moneyquest-app`)
- `activate_cmd`: only if `connectivity-test` shows the default `node`/`npm`
  on `PATH` is wrong for this app — typically something like
  `source ~/nodevenv/moneyquest-app/24/bin/activate`. Leave blank otherwise.
- `confirm`: type `DEPLOY` exactly. Anything else, and the `deploy` job
  does not run at all (it's a job-level `if:`, not a prompt you can click
  past).
- Must be run against the `main` branch — the job refuses otherwise.

### What `deploy` actually does, in order

1. Builds the app fresh on the runner (Node 24.22.1, `NODE_ENV=production`,
   `NEXT_PUBLIC_SITE_URL=https://moneyquesteducation.com`) and packages it
   with the same `npm run package:namecheap` script used for manual
   releases — one packaging path, not two.
2. Verifies the server's host key against the pinned fingerprint again (see
   below) and loads the deploy key into `ssh-agent`.
3. **Backs up** the live `app_path` (tar, excluding `node_modules`) to
   `~/moneyquest-backups/backup-<UTC timestamp>.tar.gz` on the server, and
   verifies the tarball is readable and non-trivially sized before
   continuing.
4. **Deploys**: `rsync`s the new release into `app_path` in place (never
   touching `node_modules/` or `tmp/`), then runs `npm ci --omit=dev` and
   touches `tmp/restart.txt` (the standard Phusion Passenger restart
   trigger Namecheap's Node.js hosting uses).
5. **Health-checks** `https://moneyquesteducation.com/api/health` for up to
   75 seconds. If it never reports `"status":"ok"`, the workflow
   **automatically rolls back** to the backup from step 3, restarts again,
   and still fails the run loudly — a failed deploy never leaves the site
   silently degraded, but it also never claims success it didn't verify.
6. Separately confirms `https://moneyquesteducation.com/api/lesson-assistant`
   does **not** report `"ready":true` — i.e., the AI Lesson Assistant stays
   disabled through this deploy, checked, not assumed.
7. Writes a summary (commit SHA, package name, app path, backup filename)
   to the run's job summary. Never prints the private key, passphrase, or
   full SSH command with credentials.

### Manual rollback (if you ever need it outside the automatic one above)

SSH in yourself and run, with the exact backup filename from a past run's
summary:

```
tar -xzf ~/moneyquest-backups/backup-<timestamp>.tar.gz -C "$(dirname /path/to/app_path)"
touch /path/to/app_path/tmp/restart.txt
```

Backups are never deleted automatically by this workflow — prune old ones
yourself once you've confirmed a release is stable.

## Security properties (why each requirement is actually met)

- **Trigger**: `workflow_dispatch` only. No `pull_request`, `push` or
  `pull_request_target` trigger exists in this file, and must never be
  added — those would let automatically-run code (including a PR from
  anyone, if the repo ever accepts outside contributions) read these
  secrets. A manual trigger always requires the triggering user to already
  have write access to this repository.
- **Host key verification**: the fingerprint
  `SHA256:sPkJ6HjJJ8rC8yiCrno8Y2+4Z/I4YBljLddFFyDHqNQ` was obtained 26
  November 2026 from an **authenticated cPanel Terminal session on the
  server itself** (server392, port 21098) — independent of any connection
  this workflow makes, not a first-contact `ssh-keyscan` from a GitHub
  runner trusting whatever it's told. Every run re-scans the host key and
  computes its SHA256 fingerprint, and **aborts immediately, loudly, before
  any authentication attempt**, if it doesn't match exactly. Host key
  checking is never disabled (`StrictHostKeyChecking=yes` and a real,
  freshly-verified `UserKnownHostsFile` on every single command — see
  `.github/actions/namecheap-ssh/action.yml`). If the real server's host
  key is ever legitimately rotated, update
  `expected-fingerprint` in that file only after repeating the same
  out-of-band cPanel Terminal check — never by re-trusting an unverified
  scan.
- **Secrets never touch disk unnecessarily, never get logged**: the
  private key is written to a `600`-permission temp file only long enough
  for `ssh-add` to load it into the agent, then deleted immediately. The
  passphrase is never passed as a command-line argument (which `ps` could
  see) and never echoed — it's read by a tiny `SSH_ASKPASS` script, at
  runtime, from its own inherited (GitHub-masked) environment variable, and
  that script is deleted immediately after use too.
- **Environment restriction**: both jobs declare `environment: production`
  — see the one-time setup above for actually restricting that environment
  to `main` and moving the secrets into it.
- **Trusted-branch-only deploy**: the `deploy` job's own `if:` independently
  re-checks `github.ref == 'refs/heads/main'` and a typed `confirm: DEPLOY`
  phrase, on top of whatever the Environment itself enforces — two
  independent layers, not one.
- **Backup/rollback**: see "What deploy actually does" above — a verified
  backup always precedes any write, and a failed health check always
  triggers an automatic restore.
- **Existing configuration preserved**: the workflow never touches cPanel's
  "Setup Node.js App" environment-variable configuration (where
  `MQ_AI_ENABLED` and friends live) — it only overlays application files
  and reinstalls dependencies, and explicitly verifies afterward that the
  AI Lesson Assistant is still reporting disabled.

## Reusing this for a future release (Claude or ChatGPT Work)

1. Merge whatever release PR to `main` first — `deploy` refuses to run from
   any other ref.
2. Run `connectivity-test` once if you're not already confident `app_path`
   and `activate_cmd` are still correct (they shouldn't change release to
   release, but confirm after any hosting-side change).
3. Run `deploy` with those confirmed values and `confirm: DEPLOY`.
4. Read the run's job summary and the health-check step's output before
   telling anyone the release is live — the workflow's own exit code is the
   authoritative answer, not an assumption.
