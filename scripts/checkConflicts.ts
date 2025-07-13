import { checkConflicts, getDirname } from '@hyperse/dependency-sync';

const pkgPatterns: string[] = [
  '@vendure/*',
  '@hyperse-hub/*',
  '@nestjs/common',
  '@nestjs/core',
  '@nestjs/graphql',
  '@nestjs/testing',
  '@nestjs/typeorm',
  'typeorm',
  'express',
  'graphql',
  'graphql-tag',
  'handlebars',
];
const ignorePackages = ['@types/express'];

const conflicts = await checkConflicts(
  getDirname(import.meta.url, '../node_modules'),
  pkgPatterns,
  ignorePackages
);

for (const [name, versions] of conflicts.entries()) {
  throw new Error(
    `Conflicting package found for name: ${name}, version: ${JSON.stringify(versions)}`
  );
}
