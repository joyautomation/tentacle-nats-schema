/**
 * NATS KV bucket definitions and schemas
 */

/**
 * KV bucket for storing current state of PLC variables
 * Keys: {projectId}:{variableId}
 * Value: PlcVariableKV JSON
 */
export const PLCVariablesBucket = {
  name: "plc_variables",
  description: "Current state of all PLC variables",
  keyPattern: "{projectId}:{variableId}",
  ttl: 0, // No expiration
  maxBytes: -1, // Unlimited
} as const;

/**
 * KV bucket for device registry
 * Keys: {projectId}:{deviceId}
 * Value: DeviceRegistryKV JSON
 */
export const DeviceRegistryBucket = {
  name: "device_registry",
  description: "Device registry and metadata",
  keyPattern: "{projectId}:{deviceId}",
  ttl: 0, // No expiration
  maxBytes: -1,
} as const;

/**
 * KV bucket for system configuration
 * Keys: {service}:{key}
 * Value: ConfigKV JSON
 */
export const ConfigBucket = {
  name: "config",
  description: "System configuration and settings",
  keyPattern: "{service}:{key}",
  ttl: 0, // No expiration
  maxBytes: -1,
} as const;

/**
 * KV bucket for storing latest measurements from field devices
 * Keys: {deviceId}:{sensorId}
 * Value: FieldSensorMessage JSON
 */
export const FieldMeasurementsBucket = {
  name: "field_measurements",
  description: "Latest measurements from field sensors",
  keyPattern: "{deviceId}:{sensorId}",
  ttl: 3600, // 1 hour - stale data is cleaned up
  maxBytes: -1,
} as const;

/**
 * KV bucket for project metadata and settings
 * Keys: {projectId}:{setting}
 * Value: JSON configuration
 */
export const ProjectSettingsBucket = {
  name: "project_settings",
  description: "Project-specific settings and metadata",
  keyPattern: "{projectId}:{setting}",
  ttl: 0,
  maxBytes: -1,
} as const;

/**
 * KV bucket for device health status
 * Keys: {deviceId}:health
 * Value: HealthCheckMessage JSON
 */
export const DeviceHealthBucket = {
  name: "device_health",
  description: "Device health status and diagnostics",
  keyPattern: "{deviceId}:health",
  ttl: 300, // 5 minutes - stale health is removed
  maxBytes: -1,
} as const;

/**
 * KV bucket for caching GraphQL results
 * Keys: {resource}:{resourceId}
 * Value: Cached GraphQL object JSON
 */
export const GraphQLCacheBucket = {
  name: "graphql_cache",
  description: "Cached GraphQL query results",
  keyPattern: "{resource}:{resourceId}",
  ttl: 60, // 1 minute - short TTL for cache
  maxBytes: -1,
} as const;

/**
 * Helper to construct KV keys
 */
export function kvKey(pattern: string, params: Record<string, string>): string {
  let result = pattern;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`{${key}}`, value);
  }
  return result;
}

/**
 * Get all bucket definitions
 */
export const ALL_KV_BUCKETS = [
  PLCVariablesBucket,
  DeviceRegistryBucket,
  ConfigBucket,
  FieldMeasurementsBucket,
  ProjectSettingsBucket,
  DeviceHealthBucket,
  GraphQLCacheBucket,
] as const;

/**
 * Map of bucket names to definitions for easy lookup
 */
export const KV_BUCKET_MAP = {
  [PLCVariablesBucket.name]: PLCVariablesBucket,
  [DeviceRegistryBucket.name]: DeviceRegistryBucket,
  [ConfigBucket.name]: ConfigBucket,
  [FieldMeasurementsBucket.name]: FieldMeasurementsBucket,
  [ProjectSettingsBucket.name]: ProjectSettingsBucket,
  [DeviceHealthBucket.name]: DeviceHealthBucket,
  [GraphQLCacheBucket.name]: GraphQLCacheBucket,
} as const;
