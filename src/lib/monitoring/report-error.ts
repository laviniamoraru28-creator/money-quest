import "server-only";

/**
 * Thin, dependency-free error-reporting wrapper. Deliberately does NOT
 * assume a specific vendor is installed — this repo has no network
 * access to `npm install @sentry/nextjs` in this environment, so
 * rather than add an unverified dependency, this posts to a
 * configurable webhook URL (Sentry, Better Stack, a simple Slack
 * webhook, or any error-tracking service that accepts a JSON POST all
 * work here) if `ERROR_REPORTING_WEBHOOK_URL` is set. With no env var
 * set, this safely no-ops to console.error — exactly today's
 * behaviour, never worse.
 *
 * To use a specific vendor's own SDK instead (recommended for
 * production — richer stack traces, breadcrumbs, release tracking):
 * `npm install @sentry/nextjs`, run `npx @sentry/wizard@latest -i
 * nextjs`, and replace this file's `reportError` call sites with
 * `Sentry.captureException`. This wrapper exists so the app has a
 * *working* reporting path today, not to discourage a proper SDK.
 */
export async function reportError(error: unknown, context?: Record<string, unknown>): Promise<void> {
  // eslint-disable-next-line no-console
  console.error("[error]", error, context);

  const webhookUrl = process.env.ERROR_REPORTING_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        stack,
        context,
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString(),
      }),
    });
  } catch {
    // Never let error reporting itself throw and mask the original error.
  }
}
