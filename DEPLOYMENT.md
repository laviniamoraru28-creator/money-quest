# Deploying Money Quest — Step by Step

> Rewritten during the 2026 launch-readiness audit. An earlier version of this file described deploying to Vercel — that is not how this project is actually deployed and following it would produce a working-but-wrong site (in particular, it would never set `NEXT_PUBLIC_SITE_URL` to the real production domain, since that variable has to be set at build time, in the step below, not afterward in any hosting dashboard). This file now describes the real pipeline: Namecheap shared hosting, built on GitHub's own servers because Namecheap's Stellar plan doesn't have enough memory to run `next build` itself.

## Why it works this way

Namecheap's Stellar plan runs Node.js apps via cPanel's "Setup Node.js App" screen, but doesn't have enough memory for Next.js's own production build process. The fix: a GitHub Actions workflow (`.github/workflows/build-for-namecheap.yml`) does the actual `next build` on GitHub's free runners — which have plenty of memory — and packages the result into a downloadable zip. A human then uploads that zip to Namecheap. Namecheap never runs `next build` itself; it only runs the already-built app via `server.js`.

## Stage 1: Run the build on GitHub Actions

1. Push your changes to this repository's `main` branch (or trigger the workflow manually from the **Actions** tab — it supports both).
2. Go to the repository's **Actions** tab on GitHub and open the latest **"Build Money Quest for Namecheap"** run.
3. Wait for it to finish (usually a few minutes). A green check means it succeeded.
4. Scroll to the run's **Artifacts** section and download **`moneyquest-namecheap-built`** — this is a zip file, and it's the only thing you need from this stage.

## Stage 2: Upload to Namecheap

1. Log in to Namecheap's cPanel for your hosting account.
2. Open **Setup Node.js App**.
3. If this is the first deployment, create a new Node.js app: set the Node.js version to **24** (matching the version the GitHub Actions build itself uses — see the workflow's `node-version` setting — using a different major version here can cause the already-built app to behave differently or fail to start), set the application startup file to `server.js`, and set the application root to wherever you'll unzip the files below.
4. Unzip the downloaded artifact and upload its contents (everything was packaged at the archive's root — `.next/`, `messages/`, `server.js`, `package.json`, `next.config.mjs`, `src/i18n/` — there is no outer wrapper folder to account for) into that application root, via cPanel's File Manager or FTP.
5. In the Node.js App screen, make sure the **`PORT`** environment variable cPanel assigns is respected (it is — `server.js` reads `process.env.PORT` automatically; see that file's own comment).
6. Click **Restart** on the Node.js app.
7. Visit your domain to confirm the site loads.

## About `NEXT_PUBLIC_SITE_URL`

This is already set correctly for you, inside the GitHub Actions workflow itself (`.github/workflows/build-for-namecheap.yml`, as an `env:` value on the build step) — it does **not** need to be, and cannot usefully be, set anywhere in Namecheap's own cPanel environment-variable screen. `NEXT_PUBLIC_*` variables are compiled directly into the built JavaScript at the moment `next build` runs; since that happens on GitHub's servers in Stage 1, not on Namecheap, anything set only in cPanel afterward would have no effect on the already-built bundle you uploaded. If the production domain ever changes, update the value in the workflow file and re-run Stage 1 — don't look for an equivalent setting in cPanel.

## If you make changes later

Repeat Stage 1 (push or manually trigger the workflow, download the new artifact) and Stage 2 (upload the new files, restart the Node.js app) for every change — there is no automatic redeploy-on-push to Namecheap the way there would be on a platform like Vercel.
