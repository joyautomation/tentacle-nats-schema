/**
 * NATS topic definitions and naming conventions
 *
 * Topic patterns use curly braces for substitutable parameters:
 * - {projectId}: Unique identifier for a PLC project
 * - {variableId}: Unique identifier for a variable within a project
 * - {deviceId}: Unique identifier for a field device
 * - {resource}: GraphQL resource type
 */

export const NATS_TOPICS = {
  /** PLC-related topics */
  plc: {
    /** Individual PLC variable data changes: plc.data.{projectId}.{variableId} */
    data: "plc.data.{projectId}.{variableId}",

    /** All variable updates from a project: plc.data.{projectId}.* */
    dataAll: "plc.data.{projectId}.*",

    /** PLC project status: plc.status.{projectId} */
    status: "plc.status.{projectId}",

    /** Request all variables from a PLC: plc.variables.request.{projectId} */
    variablesRequest: "plc.variables.request.{projectId}",
  },

  /** Field device topics */
  field: {
    /** Sensor readings: field.sensor.{deviceId} */
    sensor: "field.sensor.{deviceId}",

    /** Commands to field devices: field.command.{deviceId} */
    command: "field.command.{deviceId}",

    /** Responses from field device commands: field.response.{deviceId} */
    response: "field.response.{deviceId}",

    /** Field device status/heartbeat: field.status.{deviceId} */
    status: "field.status.{deviceId}",
  },

  /** Communication and alerting topics */
  comm: {
    /** Communication events: comm.event.{projectId} */
    event: "comm.event.{projectId}",

    /** Critical alerts: comm.alert.{projectId} */
    alert: "comm.alert.{projectId}",
  },

  /** GraphQL subscription topics */
  graphql: {
    /** GraphQL resource updates: graphql.update.{resource} */
    update: "graphql.update.{resource}",
  },

  /** MQTT bridge topics */
  mqtt: {
    /** Inbound MQTT messages: mqtt.inbound.{topic} */
    inbound: "mqtt.inbound.{topic}",

    /** Outbound MQTT messages: mqtt.outbound.{topic} */
    outbound: "mqtt.outbound.{topic}",
  },

  /** System health and monitoring */
  system: {
    /** Service health checks: system.health.{service} */
    health: "system.health.{service}",

    /** System events: system.event */
    event: "system.event",
  },
} as const;

/**
 * Helper to substitute placeholders in topic patterns
 */
export function substituteTopic(
  pattern: string,
  params: Record<string, string>,
): string {
  let result = pattern;
  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`{${key}}`, value);
  }
  return result;
}

/**
 * Validates that a topic pattern has all required substitutions
 */
export function validateSubstitution(topic: string): boolean {
  return !/{[^}]+}/.test(topic);
}

/**
 * Common topic subscription patterns (using NATS wildcards)
 */
export const NATS_SUBSCRIPTIONS = {
  // Subscribe to all PLC variable updates from a project
  allProjectVariables: (projectId: string) =>
    substituteTopic(NATS_TOPICS.plc.dataAll, { projectId }),

  // Subscribe to all field sensor readings
  allFieldSensors: () => "field.sensor.>",

  // Subscribe to all events from a project
  allProjectEvents: (projectId: string) =>
    substituteTopic(NATS_TOPICS.comm.event, { projectId }),

  // Subscribe to all critical alerts
  allAlerts: (projectId: string) =>
    substituteTopic(NATS_TOPICS.comm.alert, { projectId }),

  // Subscribe to all GraphQL updates
  allGraphQLUpdates: () => "graphql.update.>",

  // Subscribe to all MQTT traffic
  allMqttInbound: () => "mqtt.inbound.>",
  allMqttOutbound: () => "mqtt.outbound.>",

  // Subscribe to all system events
  allSystemEvents: () => "system.>",
} as const;

/**
 * Export all topics as a flat list for documentation and discovery
 */
export function getAllTopicPatterns(): string[] {
  const patterns: string[] = [];

  function collectPatterns(obj: unknown, prefix = "") {
    if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "string") {
          patterns.push(value);
        } else if (typeof value === "object" && value !== null) {
          collectPatterns(value, `${prefix}${key}.`);
        }
      }
    }
  }

  collectPatterns(NATS_TOPICS);
  return patterns.sort();
}
