import { getPackages } from '../../src/utils/getPackages.js';

describe('getPackages', () => {
  it('should get the packages', async () => {
    const { packages } = await getPackages(process.cwd());
    expect(packages.length).toBe(1);
    expect(packages[0].packageJson.name).toBe('@hyperse/dependency-sync');
    expect(packages[0].dir).toBe(process.cwd());
    expect(packages[0].relativeDir).toBe('.');
  });
});
