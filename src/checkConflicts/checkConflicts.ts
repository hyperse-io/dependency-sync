import { fileWalk } from '../utils/fileWalk.js';
import { readJson } from '../utils/readJson.js';

interface PackageJson {
  name: string;
  version: string;
}

type VersionMap = Map<string, string[]>;

/**
 * Check for conflicting packages in the node_modules directory.
 * @example
 * ```ts
 * const files = await checkConflicts([
 *   '@vendure/*',
 *   '@hyperse-hub/*',
 *   '@nestjs/common',
 * ]);
 * ```
 * @param nodeModulesPath - Path to node_modules directory
 * @param pkgPatterns - The modules to check for conflicts.
 * @param ignorePackages - Packages to ignore when checking for conflicts
 * @returns Map of package names to their conflicting versions
 */
export const checkConflicts = async (
  nodeModulesPath: string,
  pkgPatterns: string[],
  ignorePackages: string[] = []
): Promise<VersionMap> => {
  const packageJsonFiles = await findPackageJsonFiles(
    nodeModulesPath,
    pkgPatterns
  );
  const versionMap = await buildVersionMap(packageJsonFiles);
  return filterConflicts(versionMap, ignorePackages);
};

async function findPackageJsonFiles(
  nodeModulesPath: string,
  pkgPatterns: string[]
): Promise<string[]> {
  const patterns = pkgPatterns.map((scoped) => `**/${scoped}/package.json`);
  return fileWalk(patterns, {
    cwd: nodeModulesPath,
    unique: true,
  });
}

async function buildVersionMap(files: string[]): Promise<VersionMap> {
  const versionMap = new Map<string, string[]>();

  for (const file of files) {
    const { name, version } = readJson<PackageJson>(file);
    const versions = versionMap.get(name) ?? [];
    versions.push(version);
    versionMap.set(name, versions);
  }

  return versionMap;
}

function filterConflicts(
  versionMap: VersionMap,
  ignorePackages: string[]
): VersionMap {
  return new Map(
    Array.from(versionMap.entries()).filter(
      ([name, versions]) =>
        versions.length > 1 && !ignorePackages.includes(name)
    )
  );
}
