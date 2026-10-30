# Deploying Money Quest to Namecheap

The current deployment instructions are in [docs/deployment-runbook.md](docs/deployment-runbook.md). The owner's final release requirements and work order are recorded in [docs/final-website-requirements-20261029.md](docs/final-website-requirements-20261029.md).

Use Node 24, the existing server.js startup file, the real production domain and a production build made on a suitable runner. The website is a Next.js Node application, not a static HTML upload. It does not require Supabase or child accounts.

Do not push main just to generate an archive. Once the requested website work, all-language editorial checks and final SEO are complete, package the exact tested website ref and rehearse the extracted archive before delivery. The Namecheap workflow can be selected manually for that ref; its green build alone does not establish release readiness.

The upload package must include matching .next output, public assets and offline manifest, required runtime/configuration files, a checksum and clear upload/rollback instructions. Keep credentials, private review/order data and full paid product files out of the public application archive. Install dependencies in the hosting app's Node environment and restart using the existing account configuration.

This documentation update does not create an archive, deploy or merge main. The owner has requested the final archive after the completion criteria are met. Packaging instructions do not enable live payments. See the full runbook for the precise file list, optional review storage, disabled shop configuration and verification steps.
