/**
 * Shared data types for NATS messages across the Tentacle platform.
 *
 * Most types are re-exported from proto-generated code (tentacle-proto).
 * TypeScript-specific narrowings (string literal unions, discriminated unions)
 * are defined here where proto cannot express them.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// Re-exported from proto-generated types (tentacle-proto)
// ═══════════════════════════════════════════════════════════════════════════════

// Common types
export type {
  DeadBandConfig,
  ServiceHeartbeat,
  ServiceEnabledKV,
  ServiceLogEntry,
  BrowseProgressMessage,
  HealthCheckMessage,
  CommunicationEvent,
  ConfigKV,
} from "./generated/common.ts";

// Data types
export type {
  UdtMemberDefinition,
  UdtTemplateDefinition,
  PlcDataMessage,
  PlcStatusMessage,
  PlcVariableKV,
  DeviceRegistryKV,
  GraphQLUpdate,
} from "./generated/data.ts";

// Field types
export type {
  FieldSensorMessage,
  FieldCommandMessage,
  FieldCommandResponse,
} from "./generated/field.ts";

// MQTT types
export type {
  MqttMetricInfo,
  MqttTemplateInfo,
  MqttMetricsResponse,
  MqttBridgeMessage,
} from "./generated/mqtt.ts";

// Network types
export type {
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
} from "./generated/network.ts";

// Orchestrator types
export type {
  DesiredServiceKV,
  ServiceStatusKV,
  ModuleConfigField,
  ModuleRegistryInfo,
  ModuleVersionInfo,
  OrchestratorCommandRequest,
  OrchestratorCommandResponse,
} from "./generated/orchestrator.ts";

// ═══════════════════════════════════════════════════════════════════════════════
// TypeScript-specific string literal unions (no proto equivalent)
// ═══════════════════════════════════════════════════════════════════════════════

/** Primitive member datatypes supported in a Sparkplug B UDT template */
export type UdtMemberDatatype = "number" | "boolean" | "string";

/** Service types in the Tentacle ecosystem */
export type TentacleServiceType =
  | "ethernetip"
  | "ethernetip-server"
  | "plc"
  | "gateway"
  | "mqtt"
  | "graphql"
  | "modbus"
  | "modbus-server"
  | "opcua"
  | "network"
  | "nftables"
  | "snmp"
  | "history"
  | "orchestrator";

/** Browse operation phases */
export type BrowsePhase =
  | "discovering"
  | "expanding"
  | "reading"
  | "caching"
  | "completed"
  | "failed";

/** Scanner protocol types supported by the gateway */
export type GatewayProtocol = "ethernetip" | "opcua" | "snmp" | "modbus";

/** Runtime environment for a tentacle module */
export type ModuleRuntime = "go" | "deno" | "deno-web" | "binary";

/** Module category */
export type ModuleCategory = "core" | "optional";

/** Reconciliation state of a module managed by the orchestrator */
export type ReconcileState =
  | "ok"
  | "pending"
  | "downloading"
  | "installing"
  | "starting"
  | "stopping"
  | "error"
  | "version_unavailable";

// ═══════════════════════════════════════════════════════════════════════════════
// Gateway configuration types
// (Hand-written: proto oneof generates $case discriminated unions that don't
//  match the JSON wire format; protocol fields need literal types)
// ═══════════════════════════════════════════════════════════════════════════════

import type { DeadBandConfig } from "./generated/common.ts";

/** EtherNet/IP device connection config */
export type GatewayEthernetIpDevice = {
  protocol: "ethernetip";
  host: string;
  port?: number;
};

/** OPC UA device connection config */
export type GatewayOpcuaDevice = {
  protocol: "opcua";
  endpointUrl: string;
};

/** SNMP device connection config */
export type GatewaySnmpDevice = {
  protocol: "snmp";
  host: string;
  port?: number;
  version: "1" | "2c" | "3";
  community?: string;
  v3Auth?: {
    username: string;
    securityLevel: "noAuthNoPriv" | "authNoPriv" | "authPriv";
    authProtocol?: "MD5" | "SHA";
    authPassword?: string;
    privProtocol?: "DES" | "AES";
    privPassword?: string;
  };
};

/** Modbus device connection config */
export type GatewayModbusDevice = {
  protocol: "modbus";
  host: string;
  port?: number;
  unitId?: number;
};

/** Shared device-level settings that apply to all protocols */
export type GatewayDeviceSharedSettings = {
  scanRate?: number;
  deadband?: DeadBandConfig;
  disableRBE?: boolean;
  /** Map of browse original template name → overridden unique name */
  templateNameOverrides?: Record<string, string>;
};

/** Union of all gateway device connection configs */
export type GatewayDeviceConfig =
  (GatewayEthernetIpDevice
  | GatewayOpcuaDevice
  | GatewaySnmpDevice
  | GatewayModbusDevice)
  & GatewayDeviceSharedSettings;

/** A gateway variable — maps a tag/node/OID from a device to a named variable */
export type GatewayVariableConfig = {
  /** Display name / variable ID */
  id: string;
  /** Optional human-readable description */
  description?: string;
  /** Data type of the variable */
  datatype: "number" | "boolean" | "string";
  /** Default value when no data has been received */
  default: number | boolean | string;
  /** Device ID this variable reads from (key in the devices map) */
  deviceId: string;
  /** Tag name, OPC UA nodeId, SNMP OID, or Modbus address depending on the device protocol */
  tag: string;
  /** Whether writes to this variable are routed back to the scanner */
  bidirectional?: boolean;
  /** RBE deadband configuration */
  deadband?: DeadBandConfig;
  /** Disable RBE for this variable (publish all changes) */
  disableRBE?: boolean;
  /** Modbus-specific: function code */
  functionCode?: number;
  /** Modbus-specific: data type */
  modbusDatatype?: string;
  /** Modbus-specific: byte order */
  byteOrder?: string;
  /** Modbus-specific: register address */
  address?: number;
};

/** A UDT template member definition */
export type GatewayUdtTemplateMember = {
  /** Member name */
  name: string;
  /** Normalized datatype: "number", "boolean", "string", or "struct" */
  datatype: string;
  /** For nested struct members: reference to another UDT template by name (e.g., "TIMER") */
  templateRef?: string;
  /** Default deadband config inherited by all instances (analog members only) */
  defaultDeadband?: DeadBandConfig;
};

/** A UDT template definition stored in gateway config */
export type GatewayUdtTemplate = {
  /** Template type name (e.g., "Analog_Input", "TIMER") */
  name: string;
  /** Template version */
  version?: string;
  /** Template member definitions */
  members: GatewayUdtTemplateMember[];
};

/** A UDT variable instance stored in gateway config */
export type GatewayUdtVariable = {
  /** Variable ID (typically the base tag name) */
  id: string;
  /** Device ID this variable reads from */
  deviceId: string;
  /** Base tag name on the PLC */
  tag: string;
  /** Name of the UDT template this instance uses */
  templateName: string;
  /** Maps member paths to EIP tag paths (e.g., "halm_timer.PRE" → "Instance.halm_timer.PRE") */
  memberTags: Record<string, string>;
  /** Maps member paths to their CIP type names (e.g., "halm_timer.PRE" → "DINT") */
  memberCipTypes?: Record<string, string>;
  /** Per-instance per-member deadband overrides (sparse — only stores diffs from template default) */
  memberDeadbands?: Record<string, DeadBandConfig>;
};

/** Full gateway configuration stored in NATS KV */
export type GatewayConfigKV = {
  /** Gateway instance ID */
  gatewayId: string;
  /** Scanner device connections, keyed by device ID */
  devices: Record<string, GatewayDeviceConfig>;
  /** Variable definitions, keyed by variable ID */
  variables: Record<string, GatewayVariableConfig>;
  /** UDT template definitions, keyed by template name */
  udtTemplates?: Record<string, GatewayUdtTemplate>;
  /** UDT variable instances, keyed by variable ID */
  udtVariables?: Record<string, GatewayUdtVariable>;
  /** Timestamp of last config update */
  updatedAt: number;
};

// ═══════════════════════════════════════════════════════════════════════════════
// Type guard creators (runtime validation)
// ═══════════════════════════════════════════════════════════════════════════════

import type { PlcDataMessage } from "./generated/data.ts";
import type { FieldSensorMessage, FieldCommandMessage } from "./generated/field.ts";
import type { CommunicationEvent } from "./generated/common.ts";

export function createPlcDataValidator(data: unknown): data is PlcDataMessage {
  if (typeof data !== "object" || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.moduleId === "string" &&
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
    typeof d.moduleId === "string" &&
    ["error", "warning", "info", "debug"].includes(d.type as string) &&
    typeof d.message === "string" &&
    ["critical", "high", "medium", "low"].includes(d.severity as string) &&
    typeof d.timestamp === "number" &&
    typeof d.source === "string"
  );
}
