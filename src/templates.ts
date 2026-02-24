/**
 * Pre-built Sparkplug B UDT template definitions for Tentacle service types.
 *
 * These are published as Template Definition metrics in NBIRTH by tentacle-mqtt
 * and referenced by Template Instance metrics for each individual entity
 * (e.g., one "NetworkInterface" instance per physical interface).
 */

import type { UdtTemplateDefinition } from "./types.ts";

/**
 * Template definition for a single network interface.
 * Published by tentacle-network as one UDT message per interface.
 *
 * Live stats (rx_bytes, tx_bytes, ...) come from sysfs.
 * Config fields (config_*) come from /etc/netplan/60-tentacle.yaml.
 * Array values (addresses, config_addresses, config_nameservers) are JSON strings.
 */
export const NetworkInterfaceTemplate: UdtTemplateDefinition = {
  name: "NetworkInterface",
  version: "1.0",
  members: [
    { name: "operstate", datatype: "string", description: "Operational state (up/down/unknown)" },
    { name: "carrier", datatype: "boolean", description: "Link carrier detected" },
    { name: "speed", datatype: "number", description: "Link speed in Mbps (0 if unknown)" },
    { name: "duplex", datatype: "string", description: "Duplex mode (full/half/unknown)" },
    { name: "mac", datatype: "string", description: "MAC address" },
    { name: "mtu", datatype: "number", description: "Maximum transmission unit" },
    { name: "addresses", datatype: "string", description: "IP addresses as JSON array of CIDR strings" },
    { name: "rx_bytes", datatype: "number", description: "Total bytes received" },
    { name: "tx_bytes", datatype: "number", description: "Total bytes transmitted" },
    { name: "rx_packets", datatype: "number", description: "Total packets received" },
    { name: "tx_packets", datatype: "number", description: "Total packets transmitted" },
    { name: "rx_errors", datatype: "number", description: "Receive error count" },
    { name: "tx_errors", datatype: "number", description: "Transmit error count" },
    { name: "rx_dropped", datatype: "number", description: "Received packets dropped" },
    { name: "tx_dropped", datatype: "number", description: "Transmitted packets dropped" },
    { name: "config_dhcp4", datatype: "boolean", description: "DHCP4 enabled in netplan config" },
    { name: "config_addresses", datatype: "string", description: "Static addresses as JSON array of CIDR strings" },
    { name: "config_gateway4", datatype: "string", description: "Default gateway IP" },
    { name: "config_nameservers", datatype: "string", description: "DNS nameservers as JSON array" },
    { name: "config_mtu", datatype: "number", description: "Configured MTU (0 if unset)" },
  ],
};

/**
 * Template definition for a NAT port-forwarding rule.
 * Published by tentacle-nftables as one UDT message per rule.
 */
export const NatRuleTemplate: UdtTemplateDefinition = {
  name: "NatRule",
  version: "1.0",
  members: [
    { name: "enabled", datatype: "boolean", description: "Rule is active" },
    { name: "protocol", datatype: "string", description: "Protocol: tcp | udp | icmp | all" },
    { name: "connectingDevices", datatype: "string", description: "Source filter: any | IP | range | CIDR" },
    { name: "incomingInterface", datatype: "string", description: "Incoming interface name (e.g. eth0)" },
    { name: "outgoingInterface", datatype: "string", description: "Outgoing interface name (e.g. eth1)" },
    { name: "natAddr", datatype: "string", description: "NAT IP on incoming interface subnet" },
    { name: "originalPort", datatype: "string", description: "Original port or range (empty for icmp/all)" },
    { name: "translatedPort", datatype: "string", description: "Translated port or range" },
    { name: "deviceAddr", datatype: "string", description: "Target device IP on outgoing network" },
    { name: "deviceName", datatype: "string", description: "Human-friendly device name" },
    { name: "doubleNat", datatype: "boolean", description: "Enable Double NAT (SNAT for return traffic)" },
    { name: "doubleNatAddr", datatype: "string", description: "SNAT alias IP on outgoing interface" },
    { name: "comment", datatype: "string", description: "Rule comment" },
  ],
};
