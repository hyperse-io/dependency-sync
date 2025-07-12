import { type Package } from '@manypkg/get-packages';

/**
 * @description
 * Returns a configured instance of the {@link AwsS3AssetStorageStrategy} which can then be passed to the {@link AssetServerOptions}
 * `storageStrategyFactory` property.
 *
 * Before using this strategy, make sure you have the `@aws-sdk/client-s3` and `@aws-sdk/lib-storage` package installed:
 *
 * ```sh
 * npm install \@aws-sdk/client-s3 \@aws-sdk/lib-storage
 * ```
 *
 * @example
 * ```ts
 * import { AssetServerPlugin, configureS3AssetStorage } from '\@vendure/asset-server-plugin';
 * import { DefaultAssetNamingStrategy } from '\@vendure/core';
 * import { fromEnv } from '\@aws-sdk/credential-providers';
 *
 * // ...
 *
 * plugins: [
 *   AssetServerPlugin.init({
 *     route: 'assets',
 *     assetUploadDir: path.join(__dirname, 'assets'),
 *     namingStrategy: new DefaultAssetNamingStrategy(),
 *     storageStrategyFactory: configureS3AssetStorage({
 *       bucket: 'my-s3-bucket',
 *       credentials: fromEnv(), // or any other credential provider
 *       nativeS3Configuration: {
 *         region: process.env.AWS_REGION,
 *       },
 *     }),
 * }),
 * ```
 *
 * ## Usage with MinIO
 *
 * Reference: [How to use AWS SDK for Javascript with MinIO Server](https://docs.min.io/docs/how-to-use-aws-sdk-for-javascript-with-minio-server.html)
 *
 * @example
 * ```ts
 * import { AssetServerPlugin, configureS3AssetStorage } from '\@vendure/asset-server-plugin';
 * import { DefaultAssetNamingStrategy } from '\@vendure/core';
 *
 * // ...
 *
 * plugins: [
 *   AssetServerPlugin.init({
 *     route: 'assets',
 *     assetUploadDir: path.join(__dirname, 'assets'),
 *     namingStrategy: new DefaultAssetNamingStrategy(),
 *     storageStrategyFactory: configureS3AssetStorage({
 *       bucket: 'my-minio-bucket',
 *       credentials: {
 *         accessKeyId: process.env.MINIO_ACCESS_KEY_ID,
 *         secretAccessKey: process.env.MINIO_SECRET_ACCESS_KEY,
 *       },
 *       nativeS3Configuration: {
 *         endpoint: process.env.MINIO_ENDPOINT ?? 'http://localhost:9000',
 *         forcePathStyle: true,
 *         signatureVersion: 'v4',
 *         // The `region` is required by the AWS SDK even when using MinIO,
 *         // so we just use a dummy value here.
 *         region: 'eu-west-1',
 *       },
 *     }),
 * }),
 * ```
 */
export function configureAwsS3AssetStorage() {
 //
}
