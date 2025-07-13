import { sortPackageJson as sortPackageJsonFn } from 'sort-package-json';

/**
 * Sort a package.json file.
 * @param packageJson - The package.json file to sort.
 * @returns The sorted package.json file.
 */
export function sortPackageJson<T extends Record<any, any>>(packageJson: T) {
  return sortPackageJsonFn(packageJson);
}
