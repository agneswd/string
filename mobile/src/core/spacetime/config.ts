/**
 * SpacetimeDB environment configuration.
 *
 * Reads values from EXPO_PUBLIC_* environment variables so that different
 * deployments (local dev, staging, production) can be configured without
 * code changes.
 *
 * React Native-safe — no DOM APIs, no browser globals.
 */

export interface SpacetimeConfig {
  /** Realm URL for the SpacetimeDB server, e.g. "https://maincloud.spacetimedb.com" */
  host: string
  /** SpacetimeDB module/database name to connect to. */
  moduleName: string
}

/** Fallback values used when env vars are absent (local development). */
const DEFAULTS: SpacetimeConfig = {
  host: 'ws://localhost:3000',
  moduleName: 'string',
}

/**
 * Resolve SpacetimeDB configuration from environment variables.
 *
 * Accepts an optional `env` record so the function is unit-testable without
 * mutating `process.env`.
 *
 * @example
 * const config = resolveSpacetimeConfig()
 * // { host: 'https://maincloud.spacetimedb.com', moduleName: 'my-module' }
 */
export function resolveSpacetimeConfig(
  env: Record<string, string | undefined> = process.env,
): SpacetimeConfig {
  const host = (env.EXPO_PUBLIC_SPACETIMEDB_HOST ?? DEFAULTS.host).trim()
  const moduleName = (env.EXPO_PUBLIC_SPACETIMEDB_MODULE ?? DEFAULTS.moduleName).trim()

  return { host, moduleName }
}
