import {
  getPackages as getPackagesFn,
  type GetPackagesOptions,
} from '@manypkg/get-packages';

/**
 * Get the packages in the cwd.
 * @param cwd - The current working directory.
 * @returns The packages in the cwd.
 */
export async function getPackages(cwd: string, options?: GetPackagesOptions) {
  return getPackagesFn(cwd, options);
}
