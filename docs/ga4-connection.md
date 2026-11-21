# GA4 aggregate reporting, not yet connected

This is an opt-in, read-only GitHub Actions collector. It does **not** install GA4 tracking on the website and does not assert GA4 exists. The workflow skips data collection if credentials are missing.

## Owner setup
1. Check whether Money Quest already has a GA4 property and whether website tracking is configured with appropriate consent/privacy controls. Do not install child-facing tracking automatically.
2. In the same Google Cloud project, enable **Google Analytics Data API**.
3. Grant a dedicated service account **Viewer** access in GA4 Admin > Property access management.
4. In GitHub Actions secrets set `GA4_SERVICE_ACCOUNT_JSON` to the service account JSON. A separate dedicated account/key is preferable. In repository Actions variables set `GA4_PROPERTY_ID` to the numeric GA4 property ID.
5. Manually run **GA4 aggregate research (read only)** on main. Confirm the step prints `GA4 fetched N aggregate page rows` and the job summary says `GA4 verified`. A green run with `GA4 not connected` is not proof of integration.

## Privacy and limits
Only aggregate sessions, page views and users by page path are requested. No user identifiers, demographic dimensions or event-level records. Do not use these figures to infer child outcomes. This workflow does not upload analytics artifacts, commit reports, modify production, or transmit data to another AI service.
