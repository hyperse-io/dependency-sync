import { readFileSync } from 'node:fs';
import { getDirname } from '../../src/index.js';
import { extractFileImportedModules } from '../../src/syncDependencies/extractImportedModules.js';

describe('extractFileImportedModules', () => {
  it('should extract non-relative imports from file content', () => {
    const fileContent = `
        import { gql } from "graphql-tag";
        import { PluginCommonModule, VendurePlugin } from '@vendure/core';
        import { PublicCustomerGroupsResolver } from './public-customer-groups.resolver.js';
      `;

    const result = extractFileImportedModules(fileContent);
    expect(result).toEqual(new Set(['graphql-tag', '@vendure/core']));
  });

  it('should ignore imports in comments', () => {
    const fileContent = `
        /** 
         * import { test } from "test-package";
         */
        // import { foo } from "foo-package"
        /// import { bar } from "bar-package"
        import { actual } from "actual-package";
      `;

    const result = extractFileImportedModules(fileContent);
    expect(result.size).toBe(1);
    expect(result).toEqual(new Set(['actual-package']));
  });

  it('should handle different import syntaxes', () => {
    const fileContent = `
        import defaultExport from "module-name";
        import * as name from "module-name-2";
        import { export1 } from "module-name-3";
        import { export1 as alias1 } from "module-name-4";
        import "./my-module.js";
      `;

    const result = extractFileImportedModules(fileContent);
    expect(result.size).toBe(4);
    expect(result).toEqual(
      new Set([
        'module-name',
        'module-name-2',
        'module-name-3',
        'module-name-4',
      ])
    );
  });

  it('should handle different import comment', async () => {
    const fileContent = await readFileSync(
      getDirname(
        import.meta.url,
        'fixtures',
        'configure-aws-s3-asset-storage.ts'
      ),
      'utf-8'
    );

    const result = extractFileImportedModules(fileContent);
    expect(result.size).toBe(1);
    expect(result).toEqual(new Set(['@manypkg/get-packages']));
  });

  it('should handle multiple line imports', () => {
    const fileContent = `
  import { mergeOptions } from '@hyperse-hub/vendure-common';
  import {
    Asset,
    LanguageCode,
    PluginCommonModule,
    type Type,
    VendurePlugin,
  } from '@vendure/core';
      `;

    const result = extractFileImportedModules(fileContent);
    expect(result.size).toBe(2);
    expect(result).toEqual(
      new Set(['@hyperse-hub/vendure-common', '@vendure/core'])
    );
  });
});
