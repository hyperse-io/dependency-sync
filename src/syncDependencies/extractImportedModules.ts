import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileWalk } from '../utils/fileWalk.js';

/**
 * Extract all the imported modules from the project
 * @param projectCwd - The project directory
 * @returns The import modules
 */
export async function extractImportedModules(projectCwd: string) {
  const rootCwd = existsSync(join(projectCwd, 'src'))
    ? join(projectCwd, 'src')
    : projectCwd;

  const sourceFiles = await fileWalk(
    ['**/*.ts', '**/*.js', '**/*.mjs', '**/*.cjs', '**/*.tsx', '**/*.jsx'],
    {
      cwd: rootCwd,
      absolute: true,
    }
  );
  const importedModules = new Set<string>();

  for (const filePath of sourceFiles) {
    const fileContent = readFileSync(filePath, 'utf-8');
    const fileModules = extractFileImportedModules(fileContent);
    for (const module of fileModules) {
      importedModules.add(module);
    }
  }
  return importedModules;
}

/**
 * Extract the import modules from the file content
 * @example
 * ```ts
 * import { gql } from "graphql-tag";
 * import { PluginCommonModule, VendurePlugin } from '@vendure/core';
 * import { PublicCustomerGroupsResolver } from './public-customer-groups.resolver.js';
 * ```
 * @example
 * @param fileContent - The file content
 * @returns The import modules
 */
export function extractFileImportedModules(fileContent: string) {
  // Ignore imports in ts docs comments
  const importRegex =
    /^(?![\s]*(?:\/\*\*|\/{2}|\/{3}|\*)).*import\s+(?:.*\s+from\s+)?['"]([^'"]+)['"]/gm;
  const modules = new Set<string>();
  let match;

  while ((match = importRegex.exec(fileContent)) !== null) {
    const [, module] = match;
    if (!module.startsWith('.')) {
      modules.add(module);
    }
  }
  return modules;
}
