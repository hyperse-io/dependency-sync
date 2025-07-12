import { readFileSync } from 'node:fs';

/**
 * Read a JSON file and return the parsed object.
 * @example
 * ```ts
 * const json = readJson<{ name: string }>('package.json');
 * ```
 * @param fileFrom - The path to the JSON file.
 * @returns The parsed JSON object.
 */
export function readJson<T>(fileFrom: string) {
  const content = readFileSync(fileFrom, { encoding: 'utf-8' });
  return JSON.parse(content) as T;
}
