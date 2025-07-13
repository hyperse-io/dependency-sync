import { builtinModules, isBuiltin } from 'node:module';
import { join } from 'node:path';
import type { Package } from '@manypkg/get-packages';
import { readJson } from '../utils/readJson.js';
import { extractImportedModules } from './extractImportedModules.js';

/**
 * Checks if any imported packages in the source files are missing from the project's package.json dependencies, devDependencies
 * @param projectCwd - The project directory
 * @param ignoredCheckList - The list of packages to ignore when checking for missing declarations
 */
export async function checkMissedPackageDeclaration(
  projectCwd: string,
  ignoredCheckList: string[]
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

  // Check if the imported modules are declared in the package.json file
  for (const moduleName of importedModulesOfThisProject) {
    const builtin =
      builtinModules.includes(moduleName) || isBuiltin(moduleName);

    // Ignore the builtin modules and the packages in the ignoredCheckList
    if (builtin || ignoredCheckList.includes(moduleName)) {
      continue;
    }
    // Check if the imported module is declared in the package.json file
    const matchModule = dependencies.find((x) => moduleName.startsWith(x));
    if (!matchModule) {
      // Not found in the dependencies or peerDependencies, just throw an error
      throw new Error(`No declared package (${moduleName}) in ${projectCwd}!`);
    } else {
      // Check if the imported module declared in `dependencies` or `devDependencies`
      if (
        !packgeJson['dependencies']?.[matchModule] &&
        !packgeJson['devDependencies']?.[matchModule]
      ) {
        // Not found in the dependencies or devDependencies, just throw an error
        throw new Error(
          `No declared package (${moduleName}) in ${projectCwd}! Please add it to the dependencies or devDependencies in the package.json file.`
        );
      }
    }
  }
}
