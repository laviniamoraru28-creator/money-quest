/** Optional host-only environment file. Never bundle an actual commerce.env. */
const fs = require('node:fs');
const path = require('node:path');
const file = process.env.MONEYQUEST_HOST_ENV_FILE;
if (file) {
  if (!path.isAbsolute(file)) throw new Error('Private absolute host environment path required');
  const resolved = fs.realpathSync(file);
  const inside = (candidate, root) => candidate === root || candidate.startsWith(root + path.sep);
  if (inside(resolved, fs.realpathSync(process.cwd()))) throw new Error('Host environment must be outside the application');
  if ((fs.statSync(resolved).mode & 0o077) !== 0) throw new Error('Host environment permissions must be 600');
  process.loadEnvFile(resolved);
  if (process.env.MONEYQUEST_DOCUMENT_ROOT) {
    const root = fs.realpathSync(process.env.MONEYQUEST_DOCUMENT_ROOT);
    if (inside(resolved, root)) throw new Error('Host environment must be outside the document root');
  }
}
