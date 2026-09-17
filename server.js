/**
 * Custom server required for deploying to Namecheap's cPanel "Setup
 * Node.js App" (see their own guide: "How to deploy React.js,
 * Vite.js, React Native, and Next.js applications in cPanel" —
 * shared/production Node hosting there runs an app via a startup
 * file, not `next start` directly, so this file exists specifically
 * for that hosting environment). Not used by, or needed for, any
 * other deployment target (Vercel runs `next start`/its own runtime
 * itself and never touches this file).
 *
 * Deliberately minimal — just the standard Next.js request handler
 * for every path, no custom route special-casing. All of Money
 * Quest's actual routing (the [locale] segment, every page, the API
 * route, the error Server Action) is handled inside the Next.js app
 * itself via src/middleware.ts and src/app/ — exactly as it already
 * was — this file only starts the underlying Node HTTP server that
 * cPanel's Node.js App manager expects to find and run.
 */
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "localhost";
// cPanel's Node.js App manager assigns the actual port via the PORT
// environment variable at runtime — 3000 here is only a local
// fallback for running `node server.js` directly outside cPanel.
const port = Number(process.env.PORT) || 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer(async (req, res) => {
      try {
        // --- TEMPORARY DIAGNOSTIC LOGGING — added to identify why
        // locale-prefixed paths (e.g. /ro) aren't resolving correctly
        // in this specific Namecheap/Passenger deployment. Logs the
        // exact raw request path and the proxy-forwarding headers
        // Passenger typically sets, so we can see, directly from
        // cPanel's log viewer, whether the real path is even reaching
        // this Node process intact. Remove this block once the cause
        // is confirmed — it is not meant to stay in production.
        console.log(
          "[LOCALE-DIAG]",
          JSON.stringify({
            rawUrl: req.url,
            host: req.headers.host,
            xForwardedFor: req.headers["x-forwarded-for"],
            xForwardedHost: req.headers["x-forwarded-host"],
            xForwardedProto: req.headers["x-forwarded-proto"],
            xForwardedPath: req.headers["x-forwarded-path"],
          })
        );
        const parsedUrl = parse(req.url, true);
        console.log("[LOCALE-DIAG] parsed pathname:", parsedUrl.pathname);
        // --- END TEMPORARY DIAGNOSTIC LOGGING ---
        await handle(req, res, parsedUrl);
      } catch (err) {
        console.error("Error occurred handling", req.url, err);
        res.statusCode = 500;
        res.end("internal server error");
      }
    })
      .once("error", (err) => {
        console.error(err);
        process.exit(1);
      })
      .listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
      });
  })
  .catch((err) => {
    console.error("Error starting server:", err);
    process.exit(1);
  });
