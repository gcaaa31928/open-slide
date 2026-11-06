// Rewrites an unpacked @open-slide/core tarball so it publishes under the
// fork's own name. Consumers install it as an alias, so every
// `@open-slide/core` import inside the package keeps resolving.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const [dir, name, version, repo] = process.argv.slice(2);
if (!dir || !name || !version || !repo) {
  console.error('usage: prepare-fork-package.mjs <package-dir> <name> <version> <owner/repo>');
  process.exit(1);
}
if (!/^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(version)) {
  console.error(`Not a semver version: ${version}`);
  process.exit(1);
}

const file = path.join(dir, 'package.json');
const pkg = JSON.parse(readFileSync(file, 'utf8'));
if (pkg.name !== '@open-slide/core') {
  console.error(`Expected an @open-slide/core tarball, got ${pkg.name}`);
  process.exit(1);
}

const { prepack, 'test:e2e': _e2e, ...scripts } = pkg.scripts ?? {};
const next = {
  ...pkg,
  name,
  version,
  scripts,
  repository: {
    type: 'git',
    url: `git+https://github.com/${repo}.git`,
    directory: 'packages/core',
  },
  bugs: { url: `https://github.com/${repo}/issues` },
};

writeFileSync(file, `${JSON.stringify(next, null, 2)}\n`);
console.log(`${next.name}@${next.version}`);
