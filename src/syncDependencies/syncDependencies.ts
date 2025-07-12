import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Package } from '@manypkg/get-packages';
import { getPackages } from '../utils/getPackages.js';
import { readJson } from '../utils/readJson.js';
import { sortPackageJson } from '../utils/sortPackageJson.js';
import { checkMissedPackageDeclaration } from './checkMissedPackageDeclaration.js';
import { extractImportedModules } from './extractImportedModules.js';

/**
 * Resolve the infered peer dependencies
 * @param dependencies - The dependencies
 * @param maxRangeCanbeSyncPeerDependencies - The max range can be sync peer dependencies
 * @param dependenciesReferPeepDependencies - The dependencies refer peer dependencies
 */
function resolveInferedPeerDependencies(
  dependencies: Record<string, string>,
  maxRangeCanbeSyncPeerDependencies: Record<string, string>,
  dependenciesReferPeepDependencies: Record<string, string[]>
) {
  const newPeerDependencies: Record<string, string> = {};
  for (const [key] of Object.entries(dependencies)) {
    const referPeerDependencies = dependenciesReferPeepDependencies[key];
    if (referPeerDependencies && referPeerDependencies.length) {
      for (const referPeerDependency of referPeerDependencies) {
        if (maxRangeCanbeSyncPeerDependencies[referPeerDependency]) {
          newPeerDependencies[referPeerDependency] =
            maxRangeCanbeSyncPeerDependencies[referPeerDependency];
        } else {
          console.warn(
            `referPeerDependency ${referPeerDependency} not found in maxRangeCanbeSyncPeerDependencies`
          );
        }
      }
    }
  }
  return newPeerDependencies;
}

/**
 * Clean the empty dependencies
 * @param packageJson - The package.json file
 */
function cleanEmptyDependencies(packageJson: Package['packageJson']) {
  const dependencies = packageJson['dependencies'] as Record<string, string>;
  const devDependencies = packageJson['devDependencies'] as Record<
    string,
    string
  >;
  const peerDependencies = packageJson['peerDependencies'] as Record<
    string,
    string
  >;
  if (Object.keys(dependencies).length === 0) {
    delete packageJson['dependencies'];
  }
  if (Object.keys(devDependencies).length === 0) {
    delete packageJson['devDependencies'];
  }
  if (Object.keys(peerDependencies).length === 0) {
    delete packageJson['peerDependencies'];
  }
}

/**
 * Tidy the peer dependencies
 * @param packageCwd - The package directory
 * @param maxRangeCanbeSyncPeerDependencies - The max range can be sync peer dependencies
 * @param dependenciesReferPeepDependencies - The dependencies refer peer dependencies
 */
const tidyPeerDependencies = async (
  packageCwd: string,
  maxRangeCanbeSyncPeerDependencies: Record<string, string>,
  dependenciesReferPeepDependencies: Record<string, string[]>
) => {
  // Extract the imported modules of this project from the source files
  const importedModulesOfThisProject = await extractImportedModules(packageCwd);
  // Sort the peer dependencies by length, to avoid the longest match
  const maxRangeCanbeSyncPeerDependencyKeys = Object.keys(
    maxRangeCanbeSyncPeerDependencies
  ).sort((a, b) => b.length - a.length);

  const needSyncToPeerDependencies: Record<string, string> = {};

  for (const moduleName of importedModulesOfThisProject) {
    // Check if the imported module is a peer dependency
    const matchModule = maxRangeCanbeSyncPeerDependencyKeys.find((x) =>
      // handle these imports e.g. graphql, graphql-tag, '@vendure/common/lib/generated-shop-types'
      moduleName.startsWith(x)
    );
    if (matchModule) {
      needSyncToPeerDependencies[matchModule] =
        maxRangeCanbeSyncPeerDependencies[matchModule];
    }
  }

  // Extract the package.json file
  const packageJsonFile = join(packageCwd, 'package.json');
  // Extract the package.json file
  const packgeJson = readJson<Package['packageJson']>(packageJsonFile);

  // Extract the dependencies and devDependencies from the package.json file
  const oldPackageDependencies = (packgeJson['dependencies'] || {}) as Record<
    string,
    string
  >;
  // Extract the devDependencies from the package.json file
  const oldPackageDevDependencies = (packgeJson['devDependencies'] ||
    {}) as Record<string, string>;

  // Infer the dependency peers from the dependencies and devDependencies
  const newInferredPeerDependencies = resolveInferedPeerDependencies(
    // Do not includes devDependencies here, because devDependencies normally is redundant.
    Object.assign({}, oldPackageDependencies, needSyncToPeerDependencies),
    maxRangeCanbeSyncPeerDependencies,
    dependenciesReferPeepDependencies
  );

  // Sort the peer dependencies
  packgeJson.peerDependencies = sortPackageJson({
    ...needSyncToPeerDependencies,
    ...newInferredPeerDependencies,
  }) as Record<string, string>;

  // Tidy finnal dependencies, devDependencies
  for (const [key, value] of Object.entries(oldPackageDependencies)) {
    // If the dependency is a peer dependency, move it to devDependencies
    if (packgeJson.peerDependencies[key]) {
      // move to devDependencies
      oldPackageDevDependencies[key] = value;
      // delete the dependency
      delete oldPackageDependencies[key];
    }
  }

  packgeJson['dependencies'] = sortPackageJson(
    oldPackageDependencies
  ) as Record<string, string>;

  packgeJson['devDependencies'] = sortPackageJson(
    oldPackageDevDependencies
  ) as Record<string, string>;

  // Clean the empty dependencies
  cleanEmptyDependencies(packgeJson);

  // Write the package.json file
  writeFileSync(packageJsonFile, JSON.stringify(packgeJson, null, 2) + '\n');
};

export interface SyncDependenciesOptions {
  excludedPackages?: (pkg: Package) => boolean;
  checkMissing?: boolean;
  maxRangeCanbeSyncPeerDependencies?: Record<string, string>;
  dependenciesReferPeepDependencies?: Record<string, string[]>;
  ignoredCheckList?: string[];
}

/**
 * Sync dependencies for all packages in the workspace
 * @param workspaceRoot - The root directory of the workspace (defaults to process.cwd())
 * @param options - Configuration options
 * @param options.excludedPackages - Whether to exclude admin-ui packages (default: true)
 * @param options.checkMissing - Whether to check for missing package declarations (default: true)
 * @param options.maxRangeCanbeSyncPeerDependencies - Map of peer dependencies and their versions
 * @param options.dependenciesReferPeepDependencies - Map of dependencies that reference peer dependencies
 * @param options.ignoredCheckList - List of packages to ignore when checking for missing declarations
 */
export async function syncDependencies(
  workspaceRoot: string = process.cwd(),
  options: SyncDependenciesOptions = {}
) {
  const {
    excludedPackages,
    checkMissing = true,
    maxRangeCanbeSyncPeerDependencies = {},
    dependenciesReferPeepDependencies = {},
    ignoredCheckList = [],
  } = options;

  const { packages } = await getPackages(workspaceRoot);

  // filter the packages that need to be checked
  const needCheckProjects = excludedPackages
    ? packages.filter((x) => !excludedPackages(x))
    : packages;

  // step1. sync peer dependencies
  for (const packageItem of needCheckProjects) {
    await tidyPeerDependencies(
      packageItem.dir,
      maxRangeCanbeSyncPeerDependencies,
      dependenciesReferPeepDependencies
    );
  }

  // step2. check missing package declarations
  if (checkMissing) {
    for (const packageItem of needCheckProjects) {
      await checkMissedPackageDeclaration(packageItem.dir, ignoredCheckList);
    }
  }
}
