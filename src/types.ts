/**
 * Shared data types for NATS messages across the Tentacle platform
 */

// ═══════════════════════════════════════════════════════════════════════════════
// Sparkplug B UDT / Template types
// ═══════════════════════════════════════════════════════════════════════════════

/** Primitive member datatypes supported in a Sparkplug B UDT template */
export type UdtMemberDatatype = "number" | "boolean" | "string";

/** A single member field in a UDT template definition */
export type UdtMemberDefinition = {
  name: string;
  datatype: UdtMemberDatatype;
  description?: string;
  /** For nested struct members: reference to another UDT template by name */
  templateRef?: string;
  /** For array members */
  isArray?: boolean;
};

/**
 * Sparkplug B UDT template definition.
 * Published as a Template Definition metric in NBIRTH; instances reference it by name.
 */
export type UdtTemplateDefinition = {
  /** Template type name used as templateRef in Sparkplug B (e.g. "NetworkInterface") */
  name: string;
  version?: string;
  members: UdtMemberDefinition[];
};

// ═══════════════════════════════════════════════════════════════════════════════

/** RBE (Report By Exception) deadband configuration */
export type DeadBandConfig = {
  /** Threshold value: only publish if change exceeds this amount (for numeric types) */
  value: number;
  /** Minimum time (ms) between publishes. Suppresses rapid changes. */
  minTime?: number;
  /** Maximum time (ms) between publishes regardless of change. Forces publish if exceeded. */
  maxTime?: number;
};

/** PLC variable data message published when a variable changes */
export type PlcDataMessage = {
  /** Module that published this data (e.g., "ethernetip", "mixing-process") */
  moduleId: string;
  /** Device/PLC this variable belongs to */
  deviceId: string;
  variableId: string;
  value: number | boolean | string | Record<string, unknown>;
  timestamp: number;
  datatype: "number" | "boolean" | "string" | "udt";
  /** Optional: RBE deadband configuration for this variable */
  deadband?: DeadBandConfig;
  /** Optional: Whether RBE checking is disabled for this variable */
  disableRBE?: boolean;
  /** Optional: Human-readable description of this variable */
  description?: string;
  /** Optional: Sparkplug B UDT template definition — present when datatype === "udt" */
  udtTemplate?: UdtTemplateDefinition;
};

/** Module status update */
export type PlcStatusMessage = {
  /** Module that published this status */
  moduleId: string;
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

// ═══════════════════════════════════════════════════════════════════════════════
// MQTT metrics / state types
// ═══════════════════════════════════════════════════════════════════════════════

/** A single metric being published by tentacle-mqtt */
export type MqttMetricInfo = {
  /** Metric/variable name (e.g. "RTU45_RECLM_INT_001_YL") */
  name: string;
  /** Sparkplug type: "double", "boolean", "string", "template" */
  sparkplugType: string;
  /** Current value */
  value: unknown;
  /** Source module (e.g. "tentacle-demo") */
  moduleId: string;
  /** PLC datatype: "number", "boolean", "string", "udt" */
  datatype: string;
  /** Template name if this is a template instance */
  templateRef?: string;
};

/** Template definition discovered by tentacle-mqtt */
export type MqttTemplateInfo = {
  /** Template name (e.g. "Pump_Maintenance") */
  name: string;
  version?: string;
  members: UdtMemberDefinition[];
};

/** Response from mqtt.metrics request/reply */
export type MqttMetricsResponse = {
  /** All metrics currently on the Sparkplug device */
  metrics: MqttMetricInfo[];
  /** All discovered template definitions */
  templates: MqttTemplateInfo[];
  /** Sparkplug device ID */
  deviceId: string;
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
  /** Module that generated this event */
  moduleId: string;
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
  name: string;
  type: string;
  status: "online" | "offline" | "error";
  lastHeartbeat: number;
  metadata?: Record<string, unknown>;
};

/** PLC variable state in KV */
export type PlcVariableKV = {
  /** Module that owns this variable (e.g., "ethernetip", "mixing-process") */
  moduleId: string;
  /** Device/PLC this variable belongs to */
  deviceId?: string;
  variableId: string;
  value: number | boolean | string | Record<string, unknown>;
  datatype: "number" | "boolean" | "string" | "udt";
  lastUpdated: number;
  /** Where this variable's value originates from */
  origin: "mqtt" | "graphql" | "plc" | "field" | "manual";
  quality: "good" | "uncertain" | "bad";
  /** Optional: NATS topic to subscribe to for this variable's value (e.g., "ethernetip.data.temperature") */
  source?: string;
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

/** Service enabled/disabled state in KV — controls whether a service actively performs work */
export type ServiceEnabledKV = {
  /** Module identifier this state applies to */
  moduleId: string;
  /** Whether the service is enabled (performing work) or disabled (idle, heartbeat-only) */
  enabled: boolean;
  /** Timestamp when the state was last changed */
  updatedAt: number;
};

/** Service heartbeat entry in KV - published by each tentacle service */
export type ServiceHeartbeat = {
  /** Type of service (e.g., "ethernetip", "plc", "mqtt") — for categorization */
  serviceType: TentacleServiceType;
  /** Unique module identifier (e.g., "ethernetip", "mixing-process", "mqtt") */
  moduleId: string;
  /** Timestamp of last heartbeat update */
  lastSeen: number;
  /** Service start time */
  startedAt: number;
  /** Service version */
  version?: string;
  /** Optional metadata (e.g., PLC connection status, tag count) */
  metadata?: Record<string, unknown>;
};

/** Service log entry — published by each service to NATS for real-time log streaming */
export type ServiceLogEntry = {
  /** Timestamp of the log entry */
  timestamp: number;
  /** Log level */
  level: "info" | "warn" | "error" | "debug";
  /** Log message */
  message: string;
  /** Service type that produced this log */
  serviceType: string;
  /** Module identifier (e.g., "ethernetip", "mqtt") */
  moduleId: string;
  /** Logger name within the service (e.g. "ethernetip:nats", "mqtt-bridge") */
  logger?: string;
};

/** Browse operation phases */
export type BrowsePhase =
  | "discovering"
  | "expanding"
  | "reading"
  | "caching"
  | "completed"
  | "failed";

/** Browse progress message - published during tag browse operations */
export type BrowseProgressMessage = {
  /** Unique identifier for this browse operation */
  browseId: string;
  /** Module performing the browse (e.g., "ethernetip") */
  moduleId: string;
  /** Device/PLC being browsed */
  deviceId: string;
  /** Current phase of the browse operation */
  phase: BrowsePhase;
  /** Total number of tags to process (0 if not yet known) */
  totalTags: number;
  /** Number of tags processed so far */
  completedTags: number;
  /** Number of errors encountered */
  errorCount: number;
  /** Human-readable status message */
  message?: string;
  /** Timestamp of this progress update */
  timestamp: number;
};

// ═══════════════════════════════════════════════════════════════════════════════
// Network monitoring and management types
// ═══════════════════════════════════════════════════════════════════════════════

/** Network interface statistics (from sysfs) */
export type NetworkInterfaceStats = {
  rxBytes: number;
  txBytes: number;
  rxPackets: number;
  txPackets: number;
  rxErrors: number;
  txErrors: number;
  rxDropped: number;
  txDropped: number;
};

/** IP address on an interface (from ip -j addr show) */
export type NetworkAddress = {
  family: "inet" | "inet6";
  address: string;
  prefixlen: number;
  scope: string;
  broadcast?: string;
};

/** Actual live state of a single network interface (from kernel via sysfs + ip) */
export type NetworkInterface = {
  name: string;
  operstate: string;
  carrier: boolean;
  speed: number | null;
  duplex: string | null;
  mac: string;
  mtu: number;
  type: number;
  flags: string[];
  addresses: NetworkAddress[];
  statistics: NetworkInterfaceStats;
};

/** Actual live network state snapshot — always from the kernel, never from config */
export type NetworkStateMessage = {
  moduleId: string;
  timestamp: number;
  interfaces: NetworkInterface[];
};

/** Desired configuration for a single ethernet interface (maps to netplan YAML) */
export type NetworkInterfaceConfig = {
  interfaceName: string;
  dhcp4?: boolean;
  addresses?: string[];
  gateway4?: string;
  nameservers?: string[];
  mtu?: number;
};

/** Network configuration command request */
export type NetworkCommandRequest = {
  requestId: string;
  action: "apply-config" | "get-config" | "add-address" | "remove-address";
  /** For apply-config: desired interface configs → written to 60-tentacle.yaml + netplan apply */
  interfaces?: NetworkInterfaceConfig[];
  /** For add-address / remove-address: target interface name */
  interfaceName?: string;
  /** For add-address / remove-address: CIDR address e.g. "10.0.0.100/24" */
  address?: string;
  timestamp: number;
};

/** Network configuration command response */
export type NetworkCommandResponse = {
  requestId: string;
  success: boolean;
  error?: string;
  /** For get-config: current declared config from 60-tentacle.yaml */
  config?: NetworkInterfaceConfig[];
  timestamp: number;
};

// ═══════════════════════════════════════════════════════════════════════════════
// nftables NAT management types
// ═══════════════════════════════════════════════════════════════════════════════

/** Unified NAT rule — each rule creates a DNAT entry plus optional SNAT (Double NAT) */
export type NatRule = {
  id: string;
  enabled: boolean;
  /** "tcp" | "udp" | "icmp" | "all" */
  protocol: string;
  /** Source filter: "any", single IP, IP range "1.2.3.4-1.2.3.10", or CIDR "10.0.0.0/24" */
  connectingDevices: string;
  /** Incoming interface (where external traffic arrives) */
  incomingInterface: string;
  /** Outgoing interface (where device lives) */
  outgoingInterface: string;
  /** NAT IP address — must be in incoming interface's subnet, unique across all rules */
  natAddr: string;
  /** Original port or range "80" or "80-90" — empty when protocol is icmp/all */
  originalPort: string;
  /** Translated port or range "8080" or "8080-8090" — offset mapping if range */
  translatedPort: string;
  /** Device IP on the outgoing network */
  deviceAddr: string;
  /** Human-friendly name for the downstream device */
  deviceName: string;
  /** Enable Double NAT (SNAT for return traffic) */
  doubleNat: boolean;
  /** For Double NAT: alias IP on outgoing interface's subnet. Empty = use outgoing interface's main IP */
  doubleNatAddr: string;
  comment: string;
};

/** Structured nftables NAT configuration */
export type NftablesConfig = {
  natRules: NatRule[];
};

/** Live nftables state snapshot — always from `nft -j list ruleset` */
export type NftablesStateMessage = {
  moduleId: string;
  timestamp: number;
  /** Raw JSON string from nft -j list ruleset */
  rawRuleset: string;
};

/** nftables configuration command request */
export type NftablesCommandRequest = {
  requestId: string;
  action: "get-config" | "apply-config";
  /** For apply-config: desired NAT rules */
  natRules?: NatRule[];
  timestamp: number;
};

/** nftables configuration command response */
export type NftablesCommandResponse = {
  requestId: string;
  success: boolean;
  error?: string;
  /** For get-config: current structured config */
  config?: NftablesConfig;
  timestamp: number;
};

// ═══════════════════════════════════════════════════════════════════════════════
// Gateway configuration types
// ═══════════════════════════════════════════════════════════════════════════════

/** Scanner protocol types supported by the gateway */
export type GatewayProtocol = "ethernetip" | "opcua" | "snmp" | "modbus";

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

/** Union of all gateway device connection configs */
export type GatewayDeviceConfig =
  | GatewayEthernetIpDevice
  | GatewayOpcuaDevice
  | GatewaySnmpDevice
  | GatewayModbusDevice;

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

/** Full gateway configuration stored in NATS KV */
export type GatewayConfigKV = {
  /** Gateway instance ID */
  gatewayId: string;
  /** Scanner device connections, keyed by device ID */
  devices: Record<string, GatewayDeviceConfig>;
  /** Variable definitions, keyed by variable ID */
  variables: Record<string, GatewayVariableConfig>;
  /** Timestamp of last config update */
  updatedAt: number;
};

// ═══════════════════════════════════════════════════════════════════════════════
// Orchestrator types
// ═══════════════════════════════════════════════════════════════════════════════

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

/** Desired state for a module, stored in NATS KV by the orchestrator */
export type DesiredServiceKV = {
  /** Module identifier (e.g., "tentacle-mqtt", "tentacle-snmp") */
  moduleId: string;
  /** Desired version (e.g., "0.0.5", "latest") */
  version: string;
  /** Whether the systemd unit should be active */
  running: boolean;
  /** Timestamp when this desired state was last changed */
  updatedAt: number;
};

/** Status of a module as reported by the orchestrator */
export type ServiceStatusKV = {
  /** Module identifier */
  moduleId: string;
  /** List of versions installed on disk */
  installedVersions: string[];
  /** Currently active (symlinked) version, null if not installed */
  activeVersion: string | null;
  /** Systemd unit state as reported by systemctl */
  systemdState: "active" | "inactive" | "failed" | "not-found";
  /** Reconciliation state */
  reconcileState: ReconcileState;
  /** Last error message, if any */
  lastError: string | null;
  /** Module runtime type */
  runtime: ModuleRuntime;
  /** Module category */
  category: ModuleCategory;
  /** GitHub repo name for this module */
  repo: string;
  /** Timestamp of last status update */
  updatedAt: number;
};

// ═══════════════════════════════════════════════════════════════════════════════
// Orchestrator command request/reply types
// ═══════════════════════════════════════════════════════════════════════════════

/** Orchestrator command request (request/reply) */
export type OrchestratorCommandRequest = {
  requestId: string;
  action: "get-registry" | "check-internet" | "get-module-versions";
  /** For get-module-versions: which module to check */
  moduleId?: string;
  timestamp: number;
};

/** Module info from the orchestrator registry */
export type ModuleRegistryInfo = {
  moduleId: string;
  repo: string;
  description: string;
  category: ModuleCategory;
  runtime: ModuleRuntime;
};

/** Version info for a specific module */
export type ModuleVersionInfo = {
  moduleId: string;
  installedVersions: string[];
  latestVersion: string | null;
  activeVersion: string | null;
};

/** Orchestrator command response */
export type OrchestratorCommandResponse = {
  requestId: string;
  success: boolean;
  error?: string;
  /** get-registry result */
  modules?: ModuleRegistryInfo[];
  /** check-internet result */
  online?: boolean;
  /** get-module-versions result */
  versions?: ModuleVersionInfo;
  timestamp: number;
};

/**
 * Type guard creators for runtime validation
 */

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
