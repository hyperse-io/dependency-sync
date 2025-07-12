import { sortPackageJson } from '../../src/utils/sortPackageJson.js';

describe('sortPackageJson', () => {
  it('should sort a package.json file', () => {
    const packageJson = {
      dependencies: {
        'sort-package-json': '1.0.0',
        'sort-object-keys': '1.0.0',
      },
      version: '1.0.0',
      name: 'my-awesome-project',
    };
    const sortedPackageJson = sortPackageJson(packageJson);
    expect(sortedPackageJson).toEqual({
      name: 'my-awesome-project',
      version: '1.0.0',
      dependencies: {
        'sort-object-keys': '1.0.0',
        'sort-package-json': '1.0.0',
      },
    });
  });

  it('should sort a key-value object', () => {
    const packageJson = {
      'sort-package-json': '1.0.0',
      'sort-object-keys': '1.0.0',
    };
    const sortedPackageJson = sortPackageJson(packageJson);
    expect(sortedPackageJson).toEqual({
      'sort-object-keys': '1.0.0',
      'sort-package-json': '1.0.0',
    });
  });
});
