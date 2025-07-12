import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { getDirname } from '../src/utils/getDirname.js';

/**
 * Method for dynamic creating fixture workspace dir for jest
 * @param url The default should be dynamic `import.meta.url`
 * @param dir The default fixture workspace dir is default: `fixture`
 * @param files `{'a/hello.txt': 'hello', 'b/hello.txt': 'hello', 'b/world.txt': 'hello'}`
 * @return __dirname
 */
export const createFixtureFiles = (
  url: string,
  dir = 'fixture',
  files: Record<string, string>
) => {
  const fixtureCwd = getDirname(url, dir);
  mkdirSync(fixtureCwd, {
    recursive: true,
  });
  for (const [key, value] of Object.entries(files)) {
    const item = join(fixtureCwd, key);
    mkdirSync(dirname(item), {
      recursive: true,
    });
    writeFileSync(item, value ? value : 'hello' + Math.random());
  }
  return fixtureCwd;
};

/**
 * Synchronously removes files and directories (modeled on the standard POSIX `rm`utility).
 * @param path the path
 */
export const rmrfSync = (path: string): void => {
  rmSync(path, {
    force: true,
    recursive: true,
  });
};
