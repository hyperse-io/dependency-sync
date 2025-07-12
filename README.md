# @hyperse/dependency-sync

A comprehensive Node.js utility for managing dependencies in monorepo environments, specifically designed for Hyperse plugin ecosystems. This tool helps maintain consistent dependency management across multiple packages in a workspace.

## Features

- 🔍 **Dependency Conflict Detection**: Identify and resolve version conflicts in `node_modules`
- 📦 **Peer Dependency Synchronization**: Automatically sync peer dependencies across packages
- 🚨 **Missing Package Detection**: Check for undeclared imports in source files
- 🏗️ **Monorepo Support**: Built for managing multiple packages in a single workspace
- ⚡ **TypeScript Support**: Full TypeScript support with type definitions
- 🎯 **Hyperse Ecosystem Optimized**: Specifically designed for Hyperse plugin development

## Installation

```bash
npm install @hyperse/dependency-sync
# or
yarn add @hyperse/dependency-sync
# or
pnpm add @hyperse/dependency-sync
```

## Quick Start

### Basic Usage

```typescript
import { syncDependencies, checkConflicts } from '@hyperse/dependency-sync';

// Sync dependencies across all packages in the workspace
await syncDependencies();

// Check for dependency conflicts
const conflicts = await checkConflicts('./node_modules', [
  '@vendure/*',
  '@nestjs/*',
]);
```

### Advanced Configuration

```typescript
import { syncDependencies } from '@hyperse/dependency-sync';

await syncDependencies(process.cwd(), {
  // Exclude specific packages from processing
  excludedPackages: (pkg) => pkg.packageJson.name === 'admin-ui',

  // Disable missing package checks
  checkMissing: false,

  // Define peer dependencies and their versions
  maxRangeCanbeSyncPeerDependencies: {
    '@vendure/core': '^3.3.5',
    '@nestjs/common': '^11.1.3',
    graphql: '^16.11.0',
  },

  // Define dependency relationships
  dependenciesReferPeepDependencies: {
    '@nestjs/graphql': ['@nestjs/core'],
    '@hyperse-hub/vendure-plugin-email': ['@vendure/common'],
  },

  // Packages to ignore during checks
  ignoredCheckList: ['dotenv', 'fs-capacitor', 'sharp'],
});
```

## API Reference

### `syncDependencies(workspaceRoot?, options?)`

Synchronizes dependencies across all packages in the workspace.

#### Parameters

- `workspaceRoot` (string, optional): Root directory of the workspace. Defaults to `process.cwd()`
- `options` (SyncDependenciesOptions, optional): Configuration options

#### Options

```typescript
interface SyncDependenciesOptions {
  excludedPackages?: (pkg: Package) => boolean;
  checkMissing?: boolean;
  maxRangeCanbeSyncPeerDependencies?: Record<string, string>;
  dependenciesReferPeepDependencies?: Record<string, string[]>;
  ignoredCheckList?: string[];
}
```

- `excludedPackages`: Function to filter out packages from processing
- `checkMissing`: Whether to check for missing package declarations (default: `true`)
- `maxRangeCanbeSyncPeerDependencies`: Map of peer dependencies and their versions
- `dependenciesReferPeepDependencies`: Map of dependencies that reference peer dependencies
- `ignoredCheckList`: List of packages to ignore when checking for missing declarations

### `checkConflicts(nodeModulesPath, pkgPatterns, ignorePackages?)`

Checks for conflicting package versions in `node_modules`.

#### Parameters

- `nodeModulesPath` (string): Path to the `node_modules` directory
- `pkgPatterns` (string[]): Array of package patterns to check (e.g., `['@vendure/*', '@nestjs/*']`)
- `ignorePackages` (string[], optional): Packages to ignore when checking for conflicts

#### Returns

Returns a `Map<string, string[]>` where keys are package names and values are arrays of conflicting versions.

### `checkMissedPackageDeclaration(projectCwd, ignoredCheckList)`

Checks if imported packages in source files are missing from `package.json`.

#### Parameters

- `projectCwd` (string): The project directory
- `ignoredCheckList` (string[]): List of packages to ignore

### `extractImportedModules(projectCwd)`

Extracts all imported modules from the project's source files.

#### Parameters

- `projectCwd` (string): The project directory

#### Returns

Returns a `Set<string>` of imported module names.

## Examples

### Example 1: Basic Dependency Synchronization

```typescript
import { syncDependencies } from '@hyperse/dependency-sync';

// Sync all packages in the current workspace
await syncDependencies();
```

### Example 2: Custom Peer Dependencies Configuration

```typescript
import { syncDependencies } from '@hyperse/dependency-sync';

const peerDependencies = {
  '@vendure/core': '^3.3.5',
  '@vendure/common': '^3.3.5',
  '@nestjs/common': '^11.1.3',
  '@nestjs/core': '^11.1.3',
  graphql: '^16.11.0',
  typeorm: '^0.3.24',
};

const dependencyRelationships = {
  '@nestjs/graphql': ['@nestjs/core'],
  '@hyperse-hub/vendure-plugin-email': ['@vendure/common'],
  '@hyperse-hub/vendure-testing': ['graphql'],
};

await syncDependencies(process.cwd(), {
  maxRangeCanbeSyncPeerDependencies: peerDependencies,
  dependenciesReferPeepDependencies: dependencyRelationships,
  ignoredCheckList: ['dotenv', 'fs-capacitor', 'sharp', 'express'],
});
```

### Example 3: Conflict Detection

```typescript
import { checkConflicts } from '@hyperse/dependency-sync';

// Check for conflicts in Vendure and NestJS packages
const conflicts = await checkConflicts('./node_modules', [
  '@vendure/*',
  '@nestjs/*',
  '@hyperse-hub/*',
]);

// Log conflicts
for (const [packageName, versions] of conflicts) {
  console.log(`${packageName}: ${versions.join(', ')}`);
}
```

### Example 4: Excluding Specific Packages

```typescript
import { syncDependencies } from '@hyperse/dependency-sync';

await syncDependencies(process.cwd(), {
  excludedPackages: (pkg) => {
    // Exclude admin-ui packages
    return (
      pkg.packageJson.name.includes('admin-ui') ||
      pkg.packageJson.name.includes('dashboard')
    );
  },
  checkMissing: true,
});
```

### Example 5: Integration with Build Scripts

```json
{
  "scripts": {
    "sync-deps": "node -e \"import('@hyperse/dependency-sync').then(m => m.syncDependencies())\"",
    "check-conflicts": "node -e \"import('@hyperse/dependency-sync').then(m => m.checkConflicts('./node_modules', ['@vendure/*', '@nestjs/*']).then(console.log))\"",
    "prebuild": "yarn sync-deps"
  }
}
```

## How It Works

### Dependency Synchronization Process

1. **Package Discovery**: Scans the workspace for all packages using `@manypkg/get-packages`
2. **Import Analysis**: Extracts all imported modules from source files
3. **Peer Dependency Resolution**: Identifies which imports should be peer dependencies
4. **Dependency Reorganization**: Moves peer dependencies to `peerDependencies` and regular dependencies to `devDependencies`
5. **Package.json Updates**: Updates all package.json files with the new dependency structure

### Conflict Detection Process

1. **Pattern Matching**: Searches for packages matching the provided patterns
2. **Version Collection**: Collects all versions of each package found
3. **Conflict Identification**: Identifies packages with multiple versions
4. **Filtering**: Removes ignored packages from the results

## Configuration Best Practices

### Peer Dependencies Configuration

```typescript
const peerDependencies = {
  // Core framework dependencies
  '@vendure/core': '^3.3.5',
  '@vendure/common': '^3.3.5',

  // NestJS dependencies
  '@nestjs/common': '^11.1.3',
  '@nestjs/core': '^11.1.3',

  // GraphQL dependencies
  graphql: '^16.11.0',
  '@apollo/server': '^4.12.2',

  // Database dependencies
  typeorm: '^0.3.24',
};
```

### Dependency Relationships

```typescript
const relationships = {
  // NestJS modules that depend on core
  '@nestjs/graphql': ['@nestjs/core'],
  '@nestjs/apollo': ['@nestjs/core'],

  // Hyperse plugins that depend on Vendure
  '@hyperse-hub/vendure-plugin-email': ['@vendure/common'],
  '@hyperse-hub/vendure-plugin-payment-core': ['@nestjs/graphql'],
};
```

### Ignored Packages

```typescript
const ignoredPackages = [
  // Build tools
  'dotenv',
  'sharp',

  // File system utilities
  'fs-capacitor',

  // Express (handled by NestJS)
  'express',
];
```

## Troubleshooting

### Common Issues

1. **Missing Package Declarations**: Ensure all imported packages are declared in `package.json`
2. **Version Conflicts**: Use `checkConflicts` to identify and resolve version conflicts
3. **Peer Dependency Issues**: Verify that peer dependencies are correctly configured

### Error Messages

- `No declared package (packageName) in projectPath!`: A package is imported but not declared in `package.json`
- `referPeerDependency packageName not found in maxRangeCanbeSyncPeerDependencies`: A dependency relationship references an undefined peer dependency

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions, please open an issue on the [GitHub repository](https://github.com/hyperse-io/dependency-sync).
