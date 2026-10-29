# Money Quest: Namecheap deployment runbook

Updated 29 October 2026 from the current website source. This replaces the obsolete account/Supabase runbook. The active website has no child accounts or Supabase dependency. Learning progress is stored on the device. Optional public reviews use server-side JSON storage; sandbox shop records and paid files require separate private storage.

## Release order

The owner requires the complete website and natural, grammatically reviewed translations in all nine languages before the final SEO pass and upload package. Follow docs/final-website-requirements-20261029.md. A successful English build or message-key check alone is insufficient. No final upload ZIP has been prepared at this checkpoint.

Work stays on the website feature/review branches. There is no need to push main merely to build a ZIP. When release work is complete, select the exact finished branch/ref for a manual Namecheap build and verify its commit against the quality run and archive manifest. Do not treat the existing packaging workflow's successful build as proof of translation, editorial or full release readiness.

## Build and package

The current application uses Next.js 15.5.28 and package.json requires Node >=24 <25. Use Node 24 for build, clean-install testing and the hosting application. The existing custom startup file is server.js; production start is npm run start.

Build on a suitable local or CI runner rather than relying on a shared-host build. Use the committed package-lock.json with npm ci. Run lint, TypeScript, unit/content checks and a production build, then the relevant browser, language, accessibility and offline checks. Set NEXT_PUBLIC_SITE_URL=https://moneyquesteducation.com when building and also in the runtime configuration so server-side URL and origin checks agree. Keep NODE_ENV=production and MONEYQUEST_COMMERCE_MODE=off for the free release unless a separately completed commerce implementation explicitly changes that scope.

The current build-for-namecheap workflow assembles .next/, public/, messages/, src/i18n/, server.js, package.json, package-lock.json and next.config.mjs. Before calling its output upload-ready, verify it by extracting into a clean directory, installing locked dependencies and starting that extracted package with server.js on Node 24. Exercise runtime imports as well as static pages. If additional source/config is required by the final runtime, include it and repeat the extracted-package test.

The release must include the generated public/offline-manifest.json and its matching .next build, static chunks, images, free PDFs and nature videos. Do not combine a new manifest with older page/chunk files. Include .next/BUILD_ID. The app is not a static HTML export and next.config.mjs does not request standalone output.

Exclude node_modules, .git, real .env files, credentials, logs, local caches, CI fixtures, review/order data and full paid product manuscripts. No paid PDF may appear in public/, the learning offline cache or a publicly accessible website archive. Deliver a checksum and manifest naming the source commit, runtime, build ID and archive contents, together with short upload and rollback instructions. Verify those checksums after packaging.

GitHub's downloaded artifact may contain the actual moneyquest-namecheap-built.zip inside an outer artifact ZIP. Inspect the contents rather than assuming the outer download is the deployment archive. The actual application archive must expose .next/, public/ and server.js directly at its root.

## Hosting configuration

Back up the existing application and record its application root, Node version, environment settings and restart method before replacement. Keep private data outside the versioned application folder. Do not overwrite an unrelated domain, Godot staging directory or host-managed configuration.

In Namecheap's Setup Node.js App, use the existing site's application root, Node 24, Production mode, the correct domain and startup file server.js. Upload the verified application archive to that root, preserving hidden .next files. Install dependencies in the application's Node environment, then restart the app. Do not replace the host's generated configuration with generic single-page-app rewrite rules. Follow the actual account's application-root configuration; do not assume public_html is the Node application root.

Provide runtime configuration through the hosting environment. Optional reviews need MONEYQUEST_REVIEW_STORE_PATH pointing to an absolute persistent JSON file and MONEYQUEST_REVIEW_MODERATION_KEY of at least 24 characters. Keep the data path outside public/application release files and back it up before replacing code. Missing review configuration produces a service-unavailable response while learning remains available.

Keep shop mode off for the free release. Current commerce code accepts sandbox test keys only and deliberately rejects live mode. .env.commerce.example documents test-only settings. Private order/download directories must be absolute and outside the app directory. Do not include them or their secrets in a public archive. Hosting configuration is not permission to enable live payments.

## Extracted-package and hosted checks

Verify /api/health, home, Library covers/open reader, all Museum images, the three learning levels, visual Explorer, labs, games and parent/free-PDF pages. Confirm the free release leaves purchasing disabled. Check anonymous reviews and moderation only if that optional server feature has been configured; never put real submissions in test fixtures.

For every release language, inspect rendered prose, navigation, metadata, captions, image alternatives and narration language, including narrow screens, zoom, keyboard use and night/reduced-motion modes. Confirm read-aloud and optional background sound do not overlap. Test offline download, a reload without a network, an unvisited cached learning route and cached video playback/seeking.

Then check the hosted canonical URLs, sitemap, robots rules, locale alternates, redirects, asset responses and old-offline-cache update path. Keep hosted smoke-test results separate from CI evidence; a healthy process alone does not prove all content or persistent storage works.

## Rollback

Restore the previous matching application/build files and restart using the recorded hosting settings. Preserve private review/order stores and paid-download directories; these are not disposable build output. Keep the previous offline version available until the new release's cache transition is verified. Do not remove an old package or backup until recovery has been checked.

## Sources

- Current repository: package.json, server.js, next.config.mjs, .github/workflows/build-for-namecheap.yml, scripts/build-offline-manifest.ts, src/lib/reviews/store.ts and src/lib/commerce/config.ts.
- Namecheap, Next.js deployment section: https://www.namecheap.com/support/knowledgebase/article.aspx/10686/29/how-to-deploy-reactjs-vitejs-react-native-and-nextjs-applications-in-cpanel/
- Namecheap, Setup Node.js App: https://www.namecheap.com/support/knowledgebase/article.aspx/10047/2182/how-to-work-with-nodejs-app/

The provider guide describes the hosting mechanism; its older framework-version examples do not override this repository's tested Node 24 / Next.js 15 requirements. Account-specific quotas, application paths and production configuration still need verification on the target hosting account.
