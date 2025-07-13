import { getDirname, syncDependencies } from '@hyperse/dependency-sync';

const maxRangeCanbeSyncPeerDependencies = {
  // We only need to sync core dependencies into peerDependencies forcefully, others are not needed.
  '@vendure/core': '^3.3.5',
  '@vendure/common': '^3.3.5',
  '@vendure/testing': '^3.3.5',
  // '@vendure/admin-ui': '^3.3.5',
  // '@vendure/admin-ui-plugin': '^3.3.5',
  // '@vendure/asset-server-plugin': '^3.3.5',
  // '@vendure/graphiql-plugin': '^3.3.5',
  // '@vendure/job-queue-plugin': '^3.3.5',
  // '@vendure/ui-devkit': '^3.3.5',
  // '@vendure/dashboard': '^3.3.5',
  // '@vendure/email-plugin': '^3.3.5',
  // '@vendure/harden-plugin': '^3.3.5',
  // '@vendure/payments-plugin': '^3.3.5',
  // '@vendure/sentry-plugin': '^3.3.5',
  // '@vendure/stellate-plugin': '^3.3.5',
  // '@vendure/telemetry-plugin': '^3.3.5',
  // We must force sync these dependencies into peerDependencies to ensure they are installed with the same version as @vendure
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

// Some dev dependencies are peer dependencies, but they are referenced in the other packages, so we need to sync them to devDependencies
const dependenciesReferPeepDependencies: Record<string, string[]> = {
  '@nestjs/graphql': ['@nestjs/core'],
  '@hyperse-hub/vendure-plugin-email': ['@vendure/common'],
  '@hyperse-hub/vendure-testing': ['graphql'],
  '@hyperse-hub/vendure-plugin-reward-points': ['@vendure/common'],
  '@hyperse-hub/vendure-plugin-payment-core': ['@nestjs/graphql'],
};

const ignoredCheckList = ['dotenv', 'fs-capacitor', 'sharp', 'express'];

const cwd = getDirname(import.meta.url, '../');

syncDependencies(cwd, {
  checkMissing: true,
  ignoredCheckList,
  maxRangeCanbeSyncPeerDependencies,
  dependenciesReferPeepDependencies,
  excludedPackages(pkg) {
    return (
      pkg.packageJson.name.endsWith('vendure-admin') ||
      pkg.packageJson.name.endsWith('issilo')
    );
  },
})
  .then(() => {
    console.log('done');
  })
  .catch((err) => {
    console.error(err);
  });
