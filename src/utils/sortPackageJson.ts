import { sortPackageJson as sortPackageJsonFn } from 'sort-package-json';

/**
 * Sort a package.json file.
 * @param packageJson - The package.json file to sort.
 * @returns The sorted package.json file.
 */
export function sortPackageJson(packageJson: Record<string, unknown>) {
  return sortPackageJsonFn(packageJson, {
    sortOrder: ['name', 'version', 'dependencies', 'devDependencies'],
  });
}
