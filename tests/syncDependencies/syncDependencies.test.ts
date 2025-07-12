import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { syncDependencies } from '../../src/syncDependencies/index.js';
import { createFixtureFiles, rmrfSync } from '../test-utils.js';

// Default peer dependencies configuration
const defaultAllPeerDependencies = {
  '@vendure/core': '^3.3.5',
  '@vendure/common': '^3.3.5',
  '@vendure/admin-ui': '^3.3.5',
  '@vendure/admin-ui-plugin': '^3.3.5',
  '@vendure/asset-server-plugin': '^3.3.5',
  '@vendure/graphiql-plugin': '^3.3.5',
  '@vendure/job-queue-plugin': '^3.3.5',
  '@vendure/testing': '^3.3.5',
  '@vendure/ui-devkit': '^3.3.5',
  '@vendure/dashboard': '^3.3.5',
  '@vendure/email-plugin': '^3.3.5',
  '@vendure/harden-plugin': '^3.3.5',
  '@vendure/payments-plugin': '^3.3.5',
  '@vendure/sentry-plugin': '^3.3.5',
  '@vendure/stellate-plugin': '^3.3.5',
  '@vendure/telemetry-plugin': '^3.3.5',
  //
  '@apollo/server': '^4.12.2',
  '@graphql-tools/stitch': '^9.4.24',
  '@nestjs/apollo': '^13.1.0',
  '@nestjs/common': '^11.1.3',
  '@nestjs/core': '^11.1.3',
  '@nestjs/graphql': '^13.1.0',
  '@nestjs/platform-express': '^11.1.3',
  '@nestjs/terminus': '^11.0.0',
  '@nestjs/testing': '^11.1.3',
  '@nestjs/typeorm': '^11.0.0',
  // express: '^5.0.1',
  'body-parser': '^2.2.0',
  'cookie-session': '^2.1.0',
  graphql: '^16.11.0',
  'graphql-fields': '^2.0.3',
  'graphql-scalars': '^1.24.2',
  'graphql-tag': '^2.12.6',
  'graphql-upload': '^17.0.0',
  'reflect-metadata': '^0.2.2',
  rxjs: '^7.8.2',
  typeorm: '^0.3.24',
};

// Default dependencies reference configuration
const defaultDependenciesReferPeepDependencies: Record<string, string[]> = {
  '@nestjs/graphql': ['@nestjs/core'],
  '@hyperse-hub/vendure-plugin-email': ['@vendure/common'],
  '@hyperse-hub/vendure-testing': ['graphql'],
  '@hyperse-hub/vendure-plugin-reward-points': ['@vendure/common'],
  '@hyperse-hub/vendure-plugin-payment-core': ['@nestjs/graphql'],
};

// Default white package list
const defaultIgnoredCheckList = ['dotenv', 'fs-capacitor', 'sharp', 'express'];

// Mock the dependencies
vi.mock('../../src/utils/getPackages.js', () => ({
  getPackages: vi.fn(),
}));

vi.mock('../../src/syncDependencies/checkMissedPackageDeclaration.js', () => ({
  checkMissedPackageDeclaration: vi.fn(),
}));

vi.mock('../../src/syncDependencies/extractImportedModules.js', () => ({
  extractImportedModules: vi.fn(),
}));

describe('syncDependencies', () => {
  let fixtureCwd: string;

  beforeEach(() => {
    fixtureCwd = createFixtureFiles(import.meta.url, 'sync-deps-fixture', {
      'package.json': JSON.stringify({
        name: 'test-package',
        version: '1.0.0',
        dependencies: {
          '@vendure/core': '^3.3.5',
          '@nestjs/common': '^11.1.3',
        },
        devDependencies: {
          '@vendure/testing': '^3.3.5',
        },
      }),
      'src/index.ts': `
          import { VendureConfig } from '@vendure/core';
          import { Injectable } from '@nestjs/common';
          import { graphql } from 'graphql';
          
          @Injectable()
          export class TestService {}
        `,
    });
  });

  afterEach(() => {
    if (fixtureCwd) {
      rmrfSync(fixtureCwd);
    }
    vi.clearAllMocks();
  });

  it('should sync dependencies with default configuration', async () => {
    const { getPackages } = await import('../../src/utils/getPackages.js');
    const { checkMissedPackageDeclaration } = await import(
      '../../src/syncDependencies/checkMissedPackageDeclaration.js'
    );
    const { extractImportedModules } = await import(
      '../../src/syncDependencies/extractImportedModules.js'
    );

    // Mock getPackages to return our test package
    vi.mocked(getPackages).mockResolvedValue({
      packages: [
        {
          dir: fixtureCwd,
          packageJson: JSON.parse(
            readFileSync(join(fixtureCwd, 'package.json'), 'utf-8')
          ),
          relativeDir: '.',
        },
      ],
    } as any);

    // Mock extractImportedModules to return imported modules
    vi.mocked(extractImportedModules).mockResolvedValue(
      new Set(['@vendure/core', '@nestjs/common', 'graphql'])
    );

    // Mock checkMissedPackageDeclaration
    vi.mocked(checkMissedPackageDeclaration).mockResolvedValue(undefined);

    await syncDependencies(fixtureCwd, {
      maxRangeCanbeSyncPeerDependencies: defaultAllPeerDependencies,
      dependenciesReferPeepDependencies:
        defaultDependenciesReferPeepDependencies,
      ignoredCheckList: defaultIgnoredCheckList,
    });

    // Verify that checkMissedPackageDeclaration was called
    expect(checkMissedPackageDeclaration).toHaveBeenCalledWith(
      fixtureCwd,
      defaultIgnoredCheckList
    );

    // Verify that extractImportedModules was called
    expect(extractImportedModules).toHaveBeenCalledWith(fixtureCwd);
  });

  it('should skip missing package check when checkMissing is false', async () => {
    const { getPackages } = await import('../../src/utils/getPackages.js');
    const { checkMissedPackageDeclaration } = await import(
      '../../src/syncDependencies/checkMissedPackageDeclaration.js'
    );
    const { extractImportedModules } = await import(
      '../../src/syncDependencies/extractImportedModules.js'
    );

    vi.mocked(getPackages).mockResolvedValue({
      packages: [
        {
          dir: fixtureCwd,
          packageJson: JSON.parse(
            readFileSync(join(fixtureCwd, 'package.json'), 'utf-8')
          ),
          relativeDir: '.',
        },
      ],
    } as any);

    vi.mocked(extractImportedModules).mockResolvedValue(
      new Set(['@vendure/core', '@nestjs/common'])
    );

    vi.mocked(checkMissedPackageDeclaration).mockResolvedValue(undefined);

    await syncDependencies(fixtureCwd, {
      checkMissing: false,
      maxRangeCanbeSyncPeerDependencies: defaultAllPeerDependencies,
      dependenciesReferPeepDependencies:
        defaultDependenciesReferPeepDependencies,
      ignoredCheckList: defaultIgnoredCheckList,
    });

    // Verify that checkMissedPackageDeclaration was NOT called
    expect(checkMissedPackageDeclaration).not.toHaveBeenCalled();
  });

  it('should filter packages using excludedPackages function', async () => {
    const { getPackages } = await import('../../src/utils/getPackages.js');
    const { checkMissedPackageDeclaration } = await import(
      '../../src/syncDependencies/checkMissedPackageDeclaration.js'
    );
    const { extractImportedModules } = await import(
      '../../src/syncDependencies/extractImportedModules.js'
    );

    const mockPackages = [
      {
        dir: fixtureCwd,
        packageJson: { name: 'test-package', version: '1.0.0' },
      },
      {
        dir: join(fixtureCwd, 'admin-ui'),
        packageJson: { name: 'admin-ui', version: '1.0.0' },
      },
    ];

    vi.mocked(getPackages).mockResolvedValue({
      packages: mockPackages,
    } as any);
    vi.mocked(extractImportedModules).mockResolvedValue(
      new Set(['@vendure/core'])
    );
    vi.mocked(checkMissedPackageDeclaration).mockResolvedValue(undefined);

    const excludedPackages = (pkg: any) => pkg.packageJson.name === 'admin-ui';

    await syncDependencies(fixtureCwd, {
      excludedPackages,
      maxRangeCanbeSyncPeerDependencies: defaultAllPeerDependencies,
      dependenciesReferPeepDependencies:
        defaultDependenciesReferPeepDependencies,
      ignoredCheckList: defaultIgnoredCheckList,
    });

    // Should only process the non-excluded package
    expect(checkMissedPackageDeclaration).toHaveBeenCalledTimes(1);
    expect(checkMissedPackageDeclaration).toHaveBeenCalledWith(
      fixtureCwd,
      defaultIgnoredCheckList
    );
  });

  it('should use default options when none provided', async () => {
    const { getPackages } = await import('../../src/utils/getPackages.js');
    const { checkMissedPackageDeclaration } = await import(
      '../../src/syncDependencies/checkMissedPackageDeclaration.js'
    );
    const { extractImportedModules } = await import(
      '../../src/syncDependencies/extractImportedModules.js'
    );

    vi.mocked(getPackages).mockResolvedValue({
      packages: [
        {
          dir: fixtureCwd,
          packageJson: JSON.parse(
            readFileSync(join(fixtureCwd, 'package.json'), 'utf-8')
          ),
          relativeDir: '.',
        },
      ],
    } as any);

    vi.mocked(extractImportedModules).mockResolvedValue(
      new Set(['@vendure/core'])
    );
    vi.mocked(checkMissedPackageDeclaration).mockResolvedValue(undefined);

    await syncDependencies(fixtureCwd);

    // Should use default empty objects for optional parameters
    expect(checkMissedPackageDeclaration).toHaveBeenCalledWith(fixtureCwd, []);
  });

  it('should handle empty packages array', async () => {
    const { getPackages } = await import('../../src/utils/getPackages.js');
    const { checkMissedPackageDeclaration } = await import(
      '../../src/syncDependencies/checkMissedPackageDeclaration.js'
    );
    const { extractImportedModules } = await import(
      '../../src/syncDependencies/extractImportedModules.js'
    );

    vi.mocked(getPackages).mockResolvedValue({ packages: [] } as any);
    vi.mocked(extractImportedModules).mockResolvedValue(new Set([]));
    vi.mocked(checkMissedPackageDeclaration).mockResolvedValue(undefined);

    await syncDependencies(fixtureCwd, {
      maxRangeCanbeSyncPeerDependencies: defaultAllPeerDependencies,
      dependenciesReferPeepDependencies:
        defaultDependenciesReferPeepDependencies,
      ignoredCheckList: defaultIgnoredCheckList,
    });

    // Should not call any processing functions when no packages
    expect(checkMissedPackageDeclaration).not.toHaveBeenCalled();
    expect(extractImportedModules).not.toHaveBeenCalled();
  });

  it('should process multiple packages correctly', async () => {
    const { getPackages } = await import('../../src/utils/getPackages.js');
    const { checkMissedPackageDeclaration } = await import(
      '../../src/syncDependencies/checkMissedPackageDeclaration.js'
    );
    const { extractImportedModules } = await import(
      '../../src/syncDependencies/extractImportedModules.js'
    );

    const secondPackageDir = join(fixtureCwd, 'package2');
    createFixtureFiles(import.meta.url, 'sync-deps-fixture/package2', {
      'package.json': JSON.stringify({
        name: 'test-package-2',
        version: '1.0.0',
        dependencies: {
          '@nestjs/graphql': '^13.1.0',
        },
      }),
    });

    const mockPackages = [
      {
        dir: fixtureCwd,
        packageJson: JSON.parse(
          readFileSync(join(fixtureCwd, 'package.json'), 'utf-8')
        ),
      },
      {
        dir: secondPackageDir,
        packageJson: JSON.parse(
          readFileSync(join(secondPackageDir, 'package.json'), 'utf-8')
        ),
      },
    ];

    vi.mocked(getPackages).mockResolvedValue({ packages: mockPackages } as any);
    vi.mocked(extractImportedModules).mockResolvedValue(
      new Set(['@vendure/core'])
    );
    vi.mocked(checkMissedPackageDeclaration).mockResolvedValue(undefined);

    await syncDependencies(fixtureCwd, {
      maxRangeCanbeSyncPeerDependencies: defaultAllPeerDependencies,
      dependenciesReferPeepDependencies:
        defaultDependenciesReferPeepDependencies,
      ignoredCheckList: defaultIgnoredCheckList,
    });

    // Should process both packages
    expect(checkMissedPackageDeclaration).toHaveBeenCalledTimes(2);
    expect(extractImportedModules).toHaveBeenCalledTimes(2);
  });

  it('should use process.cwd() as default workspace root', async () => {
    const { getPackages } = await import('../../src/utils/getPackages.js');
    const { checkMissedPackageDeclaration } = await import(
      '../../src/syncDependencies/checkMissedPackageDeclaration.js'
    );
    const { extractImportedModules } = await import(
      '../../src/syncDependencies/extractImportedModules.js'
    );

    vi.mocked(getPackages).mockResolvedValue({ packages: [] } as any);
    vi.mocked(extractImportedModules).mockResolvedValue(new Set([]));
    vi.mocked(checkMissedPackageDeclaration).mockResolvedValue(undefined);

    await syncDependencies();

    // Should call getPackages with process.cwd()
    expect(getPackages).toHaveBeenCalledWith(process.cwd());
  });
});
