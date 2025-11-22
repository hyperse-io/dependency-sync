import { join } from 'node:path';
import type { Package } from '@manypkg/get-packages';
import { readJson } from '../utils/readJson.js';
import { extractImportedModules } from './extractImportedModules.js';

/**
 * Checks if any imported packages in the source files are unused in the project's package.json dependencies, devDependencies
 * @param projectCwd - The project directory
 * @param ignoredCheckList - The list of packages to ignore when checking for unused declarations
 */
export async function checkUnusedPackageDeclaration(
  projectCwd: string,
  ignoredCheckList: Array<string | RegExp>
) {
  // Extract the imported modules of this project from the source files
  const importedModulesOfThisProject = await extractImportedModules(projectCwd);
  // Extract the package.json file
  const packageJsonFile = join(projectCwd, 'package.json');
  // Extract the package.json file
  const packgeJson = readJson<Package['packageJson']>(packageJsonFile);
  // Extract the dependencies and peerDependencies from the package.json file
  // Sort by length in descending order to ensure imported modules are properly declared in either dependencies or peerDependencies
  // For example, '@scope/package/subpath' should match '@scope/package' not '@scope'
  const dependencies = Object.keys({
    ...(packgeJson['dependencies'] as Record<string, string>),
    ...(packgeJson['peerDependencies'] as Record<string, string>),
  }).sort((a, b) => b.length - a.length);

  const unusedModules = new Set<string>();
  for (const moduleName of dependencies) {
    // Ignore the builtin modules and the packages in the ignoredCheckList
    if (
      ignoredCheckList.some((x) =>
        x instanceof RegExp ? x.test(moduleName) : x === moduleName
      )
    ) {
      continue;
    }

    // Check if the imported module is used in the project
    const matchModule = Array.from(importedModulesOfThisProject).find(
      (importedModule) => importedModule.startsWith(moduleName)
    );
    if (!matchModule) {
      // Not found in the imported modules, just add it to the unused modules
      unusedModules.add(moduleName);
    }
  }
  if (unusedModules.size > 0) {
    throw new Error(
      `Unused packages in ${projectCwd}: ${Array.from(unusedModules).join(', ')}`
    );
  }
}
