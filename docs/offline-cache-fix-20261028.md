# Offline chunk URL correction

The Node 24 CI run 40746057194 passed 179 of 180 browser checks. The remaining failure was an offline navigation with missing Next.js chunks, not an educational content or accessibility assertion. The trace showed requests for encoded `%5Blocale%5D` and `%5Bslug%5D` folders while the download manifest stored literal brackets.

The service worker now canonicalises each path segment consistently when writing and reading cache entries. A regression test executes the actual download and fetch handlers and verifies both literal and encoded chunk requests while the network is unavailable, plus a cached HTML navigation.

Local regression test passed. Full browser confirmation will come from the next Node 24 CI run. No weakened assertions, retries or removed offline checks.
