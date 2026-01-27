/**
 * Runtime validators for NATS message types
 * These provide type guards for ensuring message structure at runtime
 */

import type {
  PlcDataMessage,
  PlcStatusMessage,
  FieldSensorMessage,
  FieldCommandMessage,
  FieldCommandResponse,
  CommunicationEvent,
  GraphQLUpdate,
  MqttBridgeMessage,
  HealthCheckMessage,
  BrowseProgressMessage,
} from "./types.ts";

/**
 * Validates a PlcDataMessage
 */
export function isPlcDataMessage(data: unknown): data is PlcDataMessage {
  if (typeof data !== "object" || data === null) return false;
  const msg = data as Record<string, unknown>;

  return (
    typeof msg.projectId === "string" &&
    typeof msg.variableId === "string" &&
    (typeof msg.value === "number" ||
      typeof msg.value === "boolean" ||
      typeof msg.value === "string" ||
      (typeof msg.value === "object" && msg.value !== null)) &&
    typeof msg.timestamp === "number" &&
    typeof msg.datatype === "string" &&
    ["number", "boolean", "string", "udt"].includes(msg.datatype as string)
  );
}

/**
 * Validates a PlcStatusMessage
 */
export function isPlcStatusMessage(data: unknown): data is PlcStatusMessage {
  if (typeof data !== "object" || data === null) return false;
  const msg = data as Record<string, unknown>;

  return (
    typeof msg.projectId === "string" &&
    typeof msg.status === "string" &&
    ["running", "stopped", "error", "paused"].includes(msg.status as string) &&
    typeof msg.timestamp === "number" &&
    (msg.errorMessage === undefined || typeof msg.errorMessage === "string")
  );
}

/**
 * Validates a FieldSensorMessage
 */
export function isFieldSensorMessage(data: unknown): data is FieldSensorMessage {
  if (typeof data !== "object" || data === null) return false;
  const msg = data as Record<string, unknown>;

  return (
    typeof msg.deviceId === "string" &&
    typeof msg.sensorId === "string" &&
    (typeof msg.value === "number" || typeof msg.value === "string") &&
    typeof msg.timestamp === "number" &&
    typeof msg.quality === "string" &&
    ["good", "uncertain", "bad"].includes(msg.quality as string) &&
    (msg.unit === undefined || typeof msg.unit === "string")
  );
}

/**
 * Validates a FieldCommandMessage
 */
export function isFieldCommandMessage(data: unknown): data is FieldCommandMessage {
  if (typeof data !== "object" || data === null) return false;
  const msg = data as Record<string, unknown>;

  return (
    typeof msg.deviceId === "string" &&
    typeof msg.command === "string" &&
    typeof msg.params === "object" &&
    msg.params !== null &&
    typeof msg.requestId === "string" &&
    typeof msg.timestamp === "number"
  );
}

/**
 * Validates a FieldCommandResponse
 */
export function isFieldCommandResponse(data: unknown): data is FieldCommandResponse {
  if (typeof data !== "object" || data === null) return false;
  const msg = data as Record<string, unknown>;

  return (
    typeof msg.deviceId === "string" &&
    typeof msg.requestId === "string" &&
    typeof msg.success === "boolean" &&
    typeof msg.timestamp === "number" &&
    (msg.result === undefined ||
      (typeof msg.result === "object" && msg.result !== null)) &&
    (msg.error === undefined || typeof msg.error === "string")
  );
}

/**
 * Validates a CommunicationEvent
 */
export function isCommunicationEvent(data: unknown): data is CommunicationEvent {
  if (typeof data !== "object" || data === null) return false;
  const msg = data as Record<string, unknown>;

  return (
    typeof msg.projectId === "string" &&
    typeof msg.type === "string" &&
    ["error", "warning", "info", "debug"].includes(msg.type as string) &&
    typeof msg.message === "string" &&
    typeof msg.severity === "string" &&
    ["critical", "high", "medium", "low"].includes(msg.severity as string) &&
    typeof msg.timestamp === "number" &&
    typeof msg.source === "string" &&
    (msg.tags === undefined ||
      (Array.isArray(msg.tags) && msg.tags.every((t) => typeof t === "string")))
  );
}

/**
 * Validates a GraphQLUpdate
 */
export function isGraphQLUpdate(data: unknown): data is GraphQLUpdate {
  if (typeof data !== "object" || data === null) return false;
  const msg = data as Record<string, unknown>;

  return (
    typeof msg.resource === "string" &&
    typeof msg.resourceId === "string" &&
    typeof msg.action === "string" &&
    ["created", "updated", "deleted"].includes(msg.action as string) &&
    typeof msg.data === "object" &&
    msg.data !== null &&
    typeof msg.timestamp === "number"
  );
}

/**
 * Validates a MqttBridgeMessage
 */
export function isMqttBridgeMessage(data: unknown): data is MqttBridgeMessage {
  if (typeof data !== "object" || data === null) return false;
  const msg = data as Record<string, unknown>;

  return (
    typeof msg.originalTopic === "string" &&
    typeof msg.payload === "string" &&
    typeof msg.retained === "boolean" &&
    typeof msg.qos === "number" &&
    [0, 1, 2].includes(msg.qos as number) &&
    typeof msg.timestamp === "number"
  );
}

/**
 * Validates a HealthCheckMessage
 */
export function isHealthCheckMessage(data: unknown): data is HealthCheckMessage {
  if (typeof data !== "object" || data === null) return false;
  const msg = data as Record<string, unknown>;

  return (
    typeof msg.service === "string" &&
    typeof msg.status === "string" &&
    ["healthy", "degraded", "unhealthy"].includes(msg.status as string) &&
    typeof msg.timestamp === "number" &&
    typeof msg.uptime === "number" &&
    (msg.checks === undefined ||
      (typeof msg.checks === "object" &&
        msg.checks !== null &&
        Object.values(msg.checks).every((v) => typeof v === "boolean")))
  );
}

/**
 * Validates a BrowseProgressMessage
 */
export function isBrowseProgressMessage(data: unknown): data is BrowseProgressMessage {
  if (typeof data !== "object" || data === null) return false;
  const msg = data as Record<string, unknown>;

  const validPhases = ["discovering", "expanding", "reading", "caching", "completed", "failed"];

  return (
    typeof msg.browseId === "string" &&
    typeof msg.projectId === "string" &&
    typeof msg.deviceId === "string" &&
    typeof msg.phase === "string" &&
    validPhases.includes(msg.phase as string) &&
    typeof msg.totalTags === "number" &&
    typeof msg.completedTags === "number" &&
    typeof msg.errorCount === "number" &&
    typeof msg.timestamp === "number" &&
    (msg.message === undefined || typeof msg.message === "string")
  );
}

/**
 * Combined validator for common message types
 * Returns the validated message type, or null if validation fails
 */
export function validateMessage(
  data: unknown,
  expectedType?:
    | "plcData"
    | "plcStatus"
    | "fieldSensor"
    | "fieldCommand"
    | "fieldResponse"
    | "event"
    | "graphql"
    | "mqtt"
    | "health"
    | "browseProgress",
): unknown | null {
  switch (expectedType) {
    case "plcData":
      return isPlcDataMessage(data) ? data : null;
    case "plcStatus":
      return isPlcStatusMessage(data) ? data : null;
    case "fieldSensor":
      return isFieldSensorMessage(data) ? data : null;
    case "fieldCommand":
      return isFieldCommandMessage(data) ? data : null;
    case "fieldResponse":
      return isFieldCommandResponse(data) ? data : null;
    case "event":
      return isCommunicationEvent(data) ? data : null;
    case "graphql":
      return isGraphQLUpdate(data) ? data : null;
    case "mqtt":
      return isMqttBridgeMessage(data) ? data : null;
    case "health":
      return isHealthCheckMessage(data) ? data : null;
    case "browseProgress":
      return isBrowseProgressMessage(data) ? data : null;
    default:
      // Try to detect type automatically
      if (isPlcDataMessage(data)) return data;
      if (isPlcStatusMessage(data)) return data;
      if (isFieldSensorMessage(data)) return data;
      if (isFieldCommandMessage(data)) return data;
      if (isFieldCommandResponse(data)) return data;
      if (isCommunicationEvent(data)) return data;
      if (isGraphQLUpdate(data)) return data;
      if (isMqttBridgeMessage(data)) return data;
      if (isHealthCheckMessage(data)) return data;
      if (isBrowseProgressMessage(data)) return data;
      return null;
  }
}

/**
 * Validates and parses a JSON message string
 */
export function parseAndValidate<T>(
  json: string,
  validator: (data: unknown) => data is T,
): T | null {
  try {
    const data = JSON.parse(json);
    return validator(data) ? data : null;
  } catch {
    return null;
  }
}
