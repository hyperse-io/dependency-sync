---
'@hyperse/dependency-sync': patch
---

chore: upgrade CI workflows and toolchain dependencies

- Use `lts/*` Node.js in CI/release workflows and run build before unit tests
- Pass `YARN_NPM_AUTH_TOKEN` so Yarn (Berry) can publish to npm
- Upgrade Yarn to 4.18.1 along with eslint, vitest, typescript, commitlint and other dev tooling
