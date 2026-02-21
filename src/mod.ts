/**
 * @tentacle/nats-schema
 *
 * Shared NATS topic and message schemas for the Tentacle platform.
 * This package defines the contract for all services communicating via NATS.
 *
 * Usage:
 *
 * ```typescript
 * import {
 *   NATS_TOPICS,
 *   substituteTopic,
 *   type PlcDataMessage,
 *   isPlcDataMessage,
 * } from "@tentacle/nats-schema";
 *
 * // Publish a variable data message
 * const subject = substituteTopic(NATS_TOPICS.module.data, {
 *   moduleId: "ethernetip",
 *   variableId: "temp",
 * });
 *
 * const message: PlcDataMessage = {
 *   moduleId: "ethernetip",
 *   deviceId: "plc1",
 *   variableId: "temp",
 *   value: 25.5,
 *   timestamp: Date.now(),
 *   datatype: "number",
 * };
 *
 * await nc.publish(subject, JSON.stringify(message));
 * ```
 */

// Re-export all public types and validators
export type {
  PlcDataMessage,
  PlcStatusMessage,
  FieldSensorMessage,
  FieldCommandMessage,
  FieldCommandResponse,
  CommunicationEvent,
  GraphQLUpdate,
  MqttBridgeMessage,
  DeviceRegistryKV,
  PlcVariableKV,
  ConfigKV,
  HealthCheckMessage,
  DeadBandConfig,
  TentacleServiceType,
  ServiceHeartbeat,
  ServiceLogEntry,
  BrowsePhase,
  BrowseProgressMessage,
  NetworkInterfaceStats,
  NetworkAddress,
  NetworkInterface,
  NetworkStateMessage,
  NetworkInterfaceConfig,
  NetworkCommandRequest,
  NetworkCommandResponse,
  NatRule,
  NftablesConfig,
  NftablesStateMessage,
  NftablesCommandRequest,
  NftablesCommandResponse,
} from "./types.ts";

export {
  createPlcDataValidator,
  createFieldSensorValidator,
  createFieldCommandValidator,
  createCommunicationEventValidator,
} from "./types.ts";

// Topic definitions
export { NATS_TOPICS, NATS_SUBSCRIPTIONS, substituteTopic, validateSubstitution, getAllTopicPatterns } from "./topics.ts";

// KV bucket definitions
export {
  PLCVariablesBucket,
  DeviceRegistryBucket,
  ConfigBucket,
  FieldMeasurementsBucket,
  SystemSettingsBucket,
  DeviceHealthBucket,
  ServiceHeartbeatBucket,
  GraphQLCacheBucket,
  ALL_KV_BUCKETS,
  KV_BUCKET_MAP,
  kvKey,
} from "./kv-buckets.ts";

// Runtime validators
export {
  isPlcDataMessage,
  isPlcStatusMessage,
  isFieldSensorMessage,
  isFieldCommandMessage,
  isFieldCommandResponse,
  isCommunicationEvent,
  isGraphQLUpdate,
  isMqttBridgeMessage,
  isHealthCheckMessage,
  isBrowseProgressMessage,
  isNetworkCommandRequest,
  isNftablesCommandRequest,
  validateMessage,
  parseAndValidate,
} from "./validate.ts";
