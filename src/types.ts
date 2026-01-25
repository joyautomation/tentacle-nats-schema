/**
 * Shared data types for NATS messages across the Tentacle platform
 */

/** RBE (Report By Exception) deadband configuration */
export type DeadBandConfig = {
  /** Threshold value: only publish if change exceeds this amount (for numeric types) */
  value: number;
  /** Maximum time (ms) between publishes regardless of change. Forces publish if exceeded. */
  maxTime?: number;
};

/** PLC variable data message published when a variable changes */
export type PlcDataMessage = {
  projectId: string;
  variableId: string;
  value: number | boolean | string | Record<string, unknown>;
  timestamp: number;
  datatype: "number" | "boolean" | "string" | "udt";
  /** Optional: RBE deadband configuration for this variable */
  deadband?: DeadBandConfig;
  /** Optional: Whether RBE checking is disabled for this variable */
  disableRBE?: boolean;
};

/** PLC project status update */
export type PlcStatusMessage = {
  projectId: string;
  status: "running" | "stopped" | "error" | "paused";
  timestamp: number;
  errorMessage?: string;
};

/** Field device sensor reading */
export type FieldSensorMessage = {
  deviceId: string;
  sensorId: string;
  value: number | string;
  unit?: string;
  timestamp: number;
  quality: "good" | "uncertain" | "bad";
};

/** Command to control a field device */
export type FieldCommandMessage = {
  deviceId: string;
  command: string;
  params: Record<string, unknown>;
  requestId: string;
  timestamp: number;
};

/** Response from a field device command */
export type FieldCommandResponse = {
  deviceId: string;
  requestId: string;
  success: boolean;
  result?: Record<string, unknown>;
  error?: string;
  timestamp: number;
};

/** Communication event (errors, warnings, info) */
export type CommunicationEvent = {
  projectId: string;
  type: "error" | "warning" | "info" | "debug";
  message: string;
  severity: "critical" | "high" | "medium" | "low";
  timestamp: number;
  source: string;
  tags?: string[];
};

/** GraphQL subscription update */
export type GraphQLUpdate = {
  resource: string; // e.g., "plcVariable", "fieldDevice"
  resourceId: string;
  action: "created" | "updated" | "deleted";
  data: Record<string, unknown>;
  timestamp: number;
};

/** MQTT message inbound/outbound bridge */
export type MqttBridgeMessage = {
  originalTopic: string;
  payload: string;
  retained: boolean;
  qos: 0 | 1 | 2;
  timestamp: number;
};

/** Device registry entry in KV */
export type DeviceRegistryKV = {
  deviceId: string;
  projectId: string;
  name: string;
  type: string;
  status: "online" | "offline" | "error";
  lastHeartbeat: number;
  metadata?: Record<string, unknown>;
};

/** PLC variable state in KV */
export type PlcVariableKV = {
  projectId: string;
  variableId: string;
  value: number | boolean | string | Record<string, unknown>;
  datatype: "number" | "boolean" | "string" | "udt";
  lastUpdated: number;
  source: "mqtt" | "graphql" | "plc" | "field" | "manual";
  quality: "good" | "uncertain" | "bad";
  /** RBE deadband configuration - if not specified, all changes are published */
  deadband?: DeadBandConfig;
  /** Disable RBE checking - forces publish of all changes (for debugging) */
  disableRBE?: boolean;
};

/** Configuration entry in KV */
export type ConfigKV = {
  key: string;
  value: unknown;
  version: number;
  updatedAt: number;
  updatedBy: string;
};

/** Health check message */
export type HealthCheckMessage = {
  service: string;
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: number;
  uptime: number;
  checks?: Record<string, boolean>;
};

/** Service types in the Tentacle ecosystem */
export type TentacleServiceType =
  | "ethernetip"
  | "plc"
  | "mqtt"
  | "graphql"
  | "modbus"
  | "opcua";

/** Service heartbeat entry in KV - published by each tentacle service */
export type ServiceHeartbeat = {
  /** Type of service (e.g., "ethernetip", "plc", "mqtt") */
  serviceType: TentacleServiceType;
  /** Unique instance identifier (hostname or UUID) */
  instanceId: string;
  /** Project this service is running for */
  projectId: string;
  /** Timestamp of last heartbeat update */
  lastSeen: number;
  /** Service start time */
  startedAt: number;
  /** Service version */
  version?: string;
  /** Optional metadata (e.g., PLC connection status, tag count) */
  metadata?: Record<string, unknown>;
};

/**
 * Type guard creators for runtime validation
 */

export function createPlcDataValidator(data: unknown): data is PlcDataMessage {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.projectId === "string" &&
    typeof d.variableId === "string" &&
    (typeof d.value === "number" ||
      typeof d.value === "boolean" ||
      typeof d.value === "string" ||
      typeof d.value === "object") &&
    typeof d.timestamp === "number" &&
    ["number", "boolean", "string", "udt"].includes(d.datatype as string)
  );
}

export function createFieldSensorValidator(data: unknown): data is FieldSensorMessage {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.deviceId === "string" &&
    typeof d.sensorId === "string" &&
    (typeof d.value === "number" || typeof d.value === "string") &&
    typeof d.timestamp === "number" &&
    ["good", "uncertain", "bad"].includes(d.quality as string)
  );
}

export function createFieldCommandValidator(data: unknown): data is FieldCommandMessage {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.deviceId === "string" &&
    typeof d.command === "string" &&
    typeof d.params === "object" &&
    d.params !== null &&
    typeof d.requestId === "string" &&
    typeof d.timestamp === "number"
  );
}

export function createCommunicationEventValidator(data: unknown): data is CommunicationEvent {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.projectId === "string" &&
    ["error", "warning", "info", "debug"].includes(d.type as string) &&
    typeof d.message === "string" &&
    ["critical", "high", "medium", "low"].includes(d.severity as string) &&
    typeof d.timestamp === "number" &&
    typeof d.source === "string"
  );
}
