import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { checkUnusedPackageDeclaration } from '../../src/syncDependencies/checkUnusedPackageDeclaration.js';
import { createFixtureFiles, rmrfSync } from '../test-utils.js';

// Mock dependencies
vi.mock('../../src/syncDependencies/extractImportedModules.js', () => ({
  extractImportedModules: vi.fn(),
}));

vi.mock('../../src/utils/readJson.js', () => ({
  readJson: vi.fn(),
}));

describe('checkUnusedPackageDeclaration', () => {
  let fixtureCwd: string;

  beforeEach(() => {
    fixtureCwd = createFixtureFiles(import.meta.url, 'check-unused-fixture', {
      'package.json': JSON.stringify({
        name: 'test-package',
        version: '1.0.0',
      }),
    });
  });

  afterEach(() => {
    if (fixtureCwd) {
      rmrfSync(fixtureCwd);
    }
    vi.clearAllMocks();
  });

  it('should not throw when all dependencies are used', async () => {
    const { extractImportedModules } = await import(
      '../../src/syncDependencies/extractImportedModules.js'
    );
    const { readJson } = await import('../../src/utils/readJson.js');

    vi.mocked(extractImportedModules).mockResolvedValue(
      new Set(['@vendure/core', '@nestjs/common', 'graphql'])
    );

    vi.mocked(readJson).mockReturnValue({
      name: 'test-package',
      version: '1.0.0',
      dependencies: {
        '@vendure/core': '^3.3.5',
        '@nestjs/common': '^11.1.3',
      },
      peerDependencies: {
        graphql: '^16.11.0',
      },
    } as any);

    await expect(
      checkUnusedPackageDeclaration(fixtureCwd, [])
    ).resolves.not.toThrow();
  });

  it('should throw error when unused dependencies exist', async () => {
    const { extractImportedModules } = await import(
      '../../src/syncDependencies/extractImportedModules.js'
    );
    const { readJson } = await import('../../src/utils/readJson.js');

    vi.mocked(extractImportedModules).mockResolvedValue(
      new Set(['@vendure/core', '@nestjs/common'])
    );

    vi.mocked(readJson).mockReturnValue({
      name: 'test-package',
      version: '1.0.0',
      dependencies: {
        '@vendure/core': '^3.3.5',
        '@nestjs/common': '^11.1.3',
        'unused-package': '^1.0.0',
      },
    } as any);

    await expect(checkUnusedPackageDeclaration(fixtureCwd, [])).rejects.toThrow(
      `Unused packages in ${fixtureCwd}: unused-package`
    );
  });

  it('should throw error when unused peerDependencies exist', async () => {
    const { extractImportedModules } = await import(
      '../../src/syncDependencies/extractImportedModules.js'
    );
    const { readJson } = await import('../../src/utils/readJson.js');

    vi.mocked(extractImportedModules).mockResolvedValue(
      new Set(['@vendure/core'])
    );

    vi.mocked(readJson).mockReturnValue({
      name: 'test-package',
      version: '1.0.0',
      dependencies: {
        '@vendure/core': '^3.3.5',
      },
      peerDependencies: {
        'unused-peer': '^1.0.0',
      },
    } as any);

    await expect(checkUnusedPackageDeclaration(fixtureCwd, [])).rejects.toThrow(
      `Unused packages in ${fixtureCwd}: unused-peer`
    );
  });

  it('should throw error with multiple unused packages', async () => {
    const { extractImportedModules } = await import(
      '../../src/syncDependencies/extractImportedModules.js'
    );
    const { readJson } = await import('../../src/utils/readJson.js');

    vi.mocked(extractImportedModules).mockResolvedValue(
      new Set(['@vendure/core'])
    );

    vi.mocked(readJson).mockReturnValue({
      name: 'test-package',
      version: '1.0.0',
      dependencies: {
        '@vendure/core': '^3.3.5',
        'unused-package-1': '^1.0.0',
        'unused-package-2': '^2.0.0',
      },
      peerDependencies: {
        'unused-peer-1': '^1.0.0',
      },
    } as any);

    await expect(
      checkUnusedPackageDeclaration(fixtureCwd, [])
    ).rejects.toThrow();

    const error = await checkUnusedPackageDeclaration(fixtureCwd, []).catch(
      (e) => e
    );
    expect(error.message).toContain('Unused packages in');
    expect(error.message).toContain('unused-package-1');
    expect(error.message).toContain('unused-package-2');
    expect(error.message).toContain('unused-peer-1');
  });

  it('should ignore packages in ignoredCheckList (string)', async () => {
    const { extractImportedModules } = await import(
      '../../src/syncDependencies/extractImportedModules.js'
    );
    const { readJson } = await import('../../src/utils/readJson.js');

    vi.mocked(extractImportedModules).mockResolvedValue(
      new Set(['@vendure/core'])
    );

    vi.mocked(readJson).mockReturnValue({
      name: 'test-package',
      version: '1.0.0',
      dependencies: {
        '@vendure/core': '^3.3.5',
        dotenv: '^16.0.0',
      },
    } as any);

    await expect(
      checkUnusedPackageDeclaration(fixtureCwd, ['dotenv'])
    ).resolves.not.toThrow();
  });

  it('should ignore packages in ignoredCheckList (RegExp)', async () => {
    const { extractImportedModules } = await import(
      '../../src/syncDependencies/extractImportedModules.js'
    );
    const { readJson } = await import('../../src/utils/readJson.js');

    vi.mocked(extractImportedModules).mockResolvedValue(
      new Set(['@vendure/core'])
    );

    vi.mocked(readJson).mockReturnValue({
      name: 'test-package',
      version: '1.0.0',
      dependencies: {
        '@vendure/core': '^3.3.5',
        '@vendure/testing': '^3.3.5',
      },
    } as any);

    await expect(
      checkUnusedPackageDeclaration(fixtureCwd, [/^@vendure\/testing$/])
    ).resolves.not.toThrow();
  });

  it('should match packages with subpaths correctly', async () => {
    const { extractImportedModules } = await import(
      '../../src/syncDependencies/extractImportedModules.js'
    );
    const { readJson } = await import('../../src/utils/readJson.js');

    // Import subpath of a package
    vi.mocked(extractImportedModules).mockResolvedValue(
      new Set(['@scope/package/subpath'])
    );

    vi.mocked(readJson).mockReturnValue({
      name: 'test-package',
      version: '1.0.0',
      dependencies: {
        '@scope/package': '^1.0.0',
      },
    } as any);

    // Should not throw because '@scope/package/subpath' starts with '@scope/package'
    await expect(
      checkUnusedPackageDeclaration(fixtureCwd, [])
    ).resolves.not.toThrow();
  });

  it('should handle empty dependencies and peerDependencies', async () => {
    const { extractImportedModules } = await import(
      '../../src/syncDependencies/extractImportedModules.js'
    );
    const { readJson } = await import('../../src/utils/readJson.js');

    vi.mocked(extractImportedModules).mockResolvedValue(
      new Set(['@vendure/core'])
    );

    vi.mocked(readJson).mockReturnValue({
      name: 'test-package',
      version: '1.0.0',
    } as any);

    await expect(
      checkUnusedPackageDeclaration(fixtureCwd, [])
    ).resolves.not.toThrow();
  });

  it('should handle empty imported modules', async () => {
    const { extractImportedModules } = await import(
      '../../src/syncDependencies/extractImportedModules.js'
    );
    const { readJson } = await import('../../src/utils/readJson.js');

    vi.mocked(extractImportedModules).mockResolvedValue(new Set([]));

    vi.mocked(readJson).mockReturnValue({
      name: 'test-package',
      version: '1.0.0',
      dependencies: {
        'unused-package': '^1.0.0',
      },
    } as any);

    await expect(checkUnusedPackageDeclaration(fixtureCwd, [])).rejects.toThrow(
      `Unused packages in ${fixtureCwd}: unused-package`
    );
  });

  it('should sort dependencies by length descending for proper matching', async () => {
    const { extractImportedModules } = await import(
      '../../src/syncDependencies/extractImportedModules.js'
    );
    const { readJson } = await import('../../src/utils/readJson.js');

    // Import a subpath
    vi.mocked(extractImportedModules).mockResolvedValue(
      new Set(['@scope/package/subpath/deep'])
    );

    vi.mocked(readJson).mockReturnValue({
      name: 'test-package',
      version: '1.0.0',
      dependencies: {
        '@scope': '^1.0.0',
        '@scope/package': '^1.0.0',
        '@scope/package/subpath': '^1.0.0',
      },
    } as any);

    // Should match the longest prefix '@scope/package/subpath'
    await expect(
      checkUnusedPackageDeclaration(fixtureCwd, [])
    ).resolves.not.toThrow();
  });

  it('should handle mixed dependencies and peerDependencies', async () => {
    const { extractImportedModules } = await import(
      '../../src/syncDependencies/extractImportedModules.js'
    );
    const { readJson } = await import('../../src/utils/readJson.js');

    vi.mocked(extractImportedModules).mockResolvedValue(
      new Set(['@vendure/core', 'graphql'])
    );

    vi.mocked(readJson).mockReturnValue({
      name: 'test-package',
      version: '1.0.0',
      dependencies: {
        '@vendure/core': '^3.3.5',
        'unused-dep': '^1.0.0',
      },
      peerDependencies: {
        graphql: '^16.11.0',
        'unused-peer': '^1.0.0',
      },
    } as any);

    await expect(
      checkUnusedPackageDeclaration(fixtureCwd, [])
    ).rejects.toThrow();

    const error = await checkUnusedPackageDeclaration(fixtureCwd, []).catch(
      (e) => e
    );
    expect(error.message).toContain('unused-dep');
    expect(error.message).toContain('unused-peer');
  });

  it('should call extractImportedModules with correct projectCwd', async () => {
    const { extractImportedModules } = await import(
      '../../src/syncDependencies/extractImportedModules.js'
    );
    const { readJson } = await import('../../src/utils/readJson.js');

    vi.mocked(extractImportedModules).mockResolvedValue(new Set([]));
    vi.mocked(readJson).mockReturnValue({
      name: 'test-package',
      version: '1.0.0',
    } as any);

    await checkUnusedPackageDeclaration(fixtureCwd, []);

    expect(extractImportedModules).toHaveBeenCalledWith(fixtureCwd);
  });

  it('should read package.json from correct path', async () => {
    const { extractImportedModules } = await import(
      '../../src/syncDependencies/extractImportedModules.js'
    );
    const { readJson } = await import('../../src/utils/readJson.js');

    vi.mocked(extractImportedModules).mockResolvedValue(new Set([]));
    vi.mocked(readJson).mockReturnValue({
      name: 'test-package',
      version: '1.0.0',
    } as any);

    await checkUnusedPackageDeclaration(fixtureCwd, []);

    expect(readJson).toHaveBeenCalledWith(join(fixtureCwd, 'package.json'));
  });
});
