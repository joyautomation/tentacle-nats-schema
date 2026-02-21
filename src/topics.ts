/**
 * NATS topic definitions and naming conventions
 *
 * Topic patterns use curly braces for substitutable parameters:
 * - {moduleId}: Unique identifier for a module (e.g., "ethernetip", "mixing-process")
 * - {variableId}: Unique identifier for a variable
 * - {deviceId}: Unique identifier for a field device
 * - {resource}: GraphQL resource type
 */

export const NATS_TOPICS = {
  /** Per-module data topics — any module can publish variables */
  module: {
    /** Variable data changes: {moduleId}.data.{variableId} */
    data: "{moduleId}.data.{variableId}",

    /** All variable updates from a module: {moduleId}.data.* */
    dataAll: "{moduleId}.data.*",

    /** Write command to a module's variable: {moduleId}.command.{variableId} */
    command: "{moduleId}.command.{variableId}",

    /** Request all variables from a module: {moduleId}.variables */
    variables: "{moduleId}.variables",

    /** Module status: {moduleId}.status */
    status: "{moduleId}.status",

    /** Shutdown command for a module: {moduleId}.shutdown */
    shutdown: "{moduleId}.shutdown",
  },

  /** EtherNet/IP-specific operations */
  ethernetip: {
    /** Browse progress updates: ethernetip.browse.progress.{browseId} */
    browseProgress: "ethernetip.browse.progress.{browseId}",

    /** Trigger tag browse: ethernetip.browse */
    browse: "ethernetip.browse",

    /** Subscribe to PLC tags for polling: ethernetip.subscribe */
    subscribe: "ethernetip.subscribe",

    /** Unsubscribe from PLC tags: ethernetip.unsubscribe */
    unsubscribe: "ethernetip.unsubscribe",
  },

  /** OPC UA operations */
  opcua: {
    /** Browse progress updates: opcua.browse.progress.{browseId} */
    browseProgress: "opcua.browse.progress.{browseId}",

    /** Browse address space: opcua.browse */
    browse: "opcua.browse",

    /** Subscribe to OPC UA nodes for monitoring: opcua.subscribe */
    subscribe: "opcua.subscribe",

    /** Unsubscribe from OPC UA nodes: opcua.unsubscribe */
    unsubscribe: "opcua.unsubscribe",
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

  /** Service log streaming */
  service: {
    /** Service log entries: service.logs.{serviceType}.{moduleId} */
    logs: "service.logs.{serviceType}.{moduleId}",
  },

  /** Network monitoring and management */
  network: {
    /** Periodic actual interface state snapshots (from kernel) */
    interfaces: "network.interfaces",

    /** On-demand actual state request (request/reply) */
    state: "network.state",

    /** Persistent configuration commands via netplan (request/reply) */
    command: "network.command",
  },

  /** nftables NAT management */
  nftables: {
    /** Periodic config broadcast (for GUI subscriptions) */
    rules: "nftables.rules",

    /** On-demand live ruleset request (request/reply — always fresh from nft) */
    state: "nftables.state",

    /** Configuration commands: get-config, apply-config (request/reply) */
    command: "nftables.command",
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
  /** Subscribe to all variable data from a specific module */
  allModuleData: (moduleId: string): string => `${moduleId}.data.*`,

  /** Subscribe to all variable data from all modules */
  allData: (): string => "*.data.>",

  /** Subscribe to all commands for a specific module */
  allModuleCommands: (moduleId: string): string => `${moduleId}.command.>`,

  /** Subscribe to all field sensor readings */
  allFieldSensors: (): string => "field.sensor.>",

  /** Subscribe to all GraphQL updates */
  allGraphQLUpdates: (): string => "graphql.update.>",

  /** Subscribe to all MQTT traffic */
  allMqttInbound: (): string => "mqtt.inbound.>",
  allMqttOutbound: (): string => "mqtt.outbound.>",

  /** Subscribe to shutdown command for a specific module */
  moduleShutdown: (moduleId: string): string => `${moduleId}.shutdown`,

  /** Subscribe to all system events */
  allSystemEvents: (): string => "system.>",

  /** Subscribe to logs from a specific service type */
  serviceTypeLogs: (serviceType: string): string =>
    `service.logs.${serviceType}.>`,

  /** Subscribe to all service logs */
  allServiceLogs: (): string => "service.logs.>",
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
