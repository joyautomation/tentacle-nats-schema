# @tentacle/nats-schema

Shared NATS topic and message schemas for the Tentacle platform. This package provides:

- **Topic naming conventions** - Standardized NATS subject patterns
- **Message type definitions** - TypeScript types for all message formats
- **Runtime validators** - Type guards to validate messages at runtime
- **KV bucket schemas** - Definitions for NATS KV buckets
- **Helper utilities** - Functions for substituting topic patterns and managing schemas

## Installation

### In a Deno project

Update your `deno.json` imports:

```json
{
  "imports": {
    "@tentacle/nats-schema": "file://../../nats-schema/src/mod.ts"
  }
}
```

## Quick Start

### Publishing Messages

```typescript
import {
  NATS_TOPICS,
  substituteTopic,
  type PlcDataMessage,
} from "@tentacle/nats-schema";
import { connect } from "@nats-io/transport-deno";

const nc = await connect({ servers: "localhost:4222" });

// Construct the subject using the schema
const subject = substituteTopic(NATS_TOPICS.plc.data, {
  projectId: "project-1",
  variableId: "temperature",
});

// Create a typed message
const message: PlcDataMessage = {
  projectId: "project-1",
  variableId: "temperature",
  value: 25.5,
  timestamp: Date.now(),
  datatype: "number",
};

// Publish
await nc.publish(subject, JSON.stringify(message));
```

### Subscribing with Validation

```typescript
import {
  NATS_SUBSCRIPTIONS,
  isPlcDataMessage,
} from "@tentacle/nats-schema";

// Subscribe to all variables from a project
const subject = NATS_SUBSCRIPTIONS.allProjectVariables("project-1");
const sub = nc.subscribe(subject);

for await (const msg of sub) {
  const data = JSON.parse(msg.string());

  // Runtime type guard
  if (isPlcDataMessage(data)) {
    console.log(
      `[${data.timestamp}] ${data.projectId}/${data.variableId} = ${data.value}`,
    );
  } else {
    console.warn("Invalid message received:", data);
  }
}
```

## Topic Structure

Topics follow hierarchical naming with parameter placeholders:

### PLC Topics
- `plc.data.{projectId}.{variableId}` - Variable data updates
- `plc.status.{projectId}` - Project status changes

### Field Device Topics
- `field.sensor.{deviceId}` - Sensor readings
- `field.command.{deviceId}` - Control commands
- `field.response.{deviceId}` - Command responses
- `field.status.{deviceId}` - Device status/heartbeat

### Communication Topics
- `comm.event.{projectId}` - Project events
- `comm.alert.{projectId}` - Critical alerts

### System Topics
- `system.health.{service}` - Service health checks
- `graphql.update.{resource}` - GraphQL subscription updates

### Bridge Topics
- `mqtt.inbound.{topic}` - Inbound MQTT messages
- `mqtt.outbound.{topic}` - Outbound MQTT messages

## Message Types

All message types are fully typed in TypeScript:

### PlcDataMessage
```typescript
type PlcDataMessage = {
  projectId: string;
  variableId: string;
  value: number | boolean | string | Record<string, unknown>;
  timestamp: number;
  datatype: "number" | "boolean" | "string" | "udt";
};
```

### FieldSensorMessage
```typescript
type FieldSensorMessage = {
  deviceId: string;
  sensorId: string;
  value: number | string;
  unit?: string;
  timestamp: number;
  quality: "good" | "uncertain" | "bad";
};
```

### CommunicationEvent
```typescript
type CommunicationEvent = {
  projectId: string;
  type: "error" | "warning" | "info" | "debug";
  message: string;
  severity: "critical" | "high" | "medium" | "low";
  timestamp: number;
  source: string;
  tags?: string[];
};
```

See `src/types.ts` for all message type definitions.

## KV Buckets

Store state and configuration in NATS KV:

```typescript
import {
  PLCVariablesBucket,
  DeviceRegistryBucket,
  kvKey,
  type PlcVariableKV,
} from "@tentacle/nats-schema";

// Create/reference KV buckets
const js = nc.jetstream();
const kvVariables = await js.views.kv(PLCVariablesBucket.name);

// Construct a key using the pattern
const key = kvKey(PLCVariablesBucket.keyPattern, {
  projectId: "proj-1",
  variableId: "temp",
});

// Store a variable state
const value: PlcVariableKV = {
  projectId: "proj-1",
  variableId: "temp",
  value: 25.5,
  datatype: "number",
  lastUpdated: Date.now(),
  source: "plc",
  quality: "good",
};

await kvVariables.put(key, new TextEncoder().encode(JSON.stringify(value)));
```

## KV Bucket Definitions

- **plc_variables** - Current state of all PLC variables
- **device_registry** - Device metadata and registration
- **config** - System configuration
- **field_measurements** - Latest field sensor readings (1h TTL)
- **project_settings** - Project-specific settings
- **device_health** - Device health status (5m TTL)
- **graphql_cache** - Cached GraphQL results (1m TTL)

## Runtime Validation

Use validators to ensure message integrity:

```typescript
import {
  isPlcDataMessage,
  isCommunicationEvent,
  validateMessage,
} from "@tentacle/nats-schema";

// Direct validation
if (isPlcDataMessage(data)) {
  // TypeScript now knows data is PlcDataMessage
  console.log(data.value);
}

// Parse JSON with automatic validation
const msg = parseAndValidate(jsonString, isPlcDataMessage);
if (msg) {
  console.log(`Received valid PLC message: ${msg.variableId}`);
}

// Auto-detect message type
const validated = validateMessage(data);
if (validated) {
  // Message is valid, but type is unknown
  console.log("Received valid message");
}
```

## Integration with Deno Projects

### Update deno.json

```json
{
  "imports": {
    "@tentacle/nats-schema": "file://../../nats-schema/src/mod.ts"
  }
}
```

### Example: PLC Project

```typescript
// In your PLC service
import {
  NATS_TOPICS,
  substituteTopic,
  type PlcDataMessage,
  isPlcDataMessage,
} from "@tentacle/nats-schema";

export async function publishPlcVariable(
  nc: NatsConnection,
  projectId: string,
  variableId: string,
  value: number | boolean | string,
  datatype: string,
) {
  const subject = substituteTopic(NATS_TOPICS.plc.data, {
    projectId,
    variableId,
  });

  const message: PlcDataMessage = {
    projectId,
    variableId,
    value,
    timestamp: Date.now(),
    datatype: datatype as "number" | "boolean" | "string" | "udt",
  };

  await nc.publish(subject, JSON.stringify(message));
}
```

## Best Practices

1. **Always use topic substitution helpers** - Don't construct topics manually:
   ```typescript
   // Good
   const subject = substituteTopic(NATS_TOPICS.plc.data, {
     projectId: "p1",
     variableId: "v1",
   });

   // Avoid
   const subject = `plc.data.p1.v1`;
   ```

2. **Validate messages at boundaries** - Use validators when receiving external messages:
   ```typescript
   const data = JSON.parse(msg.string());
   if (!isPlcDataMessage(data)) {
     console.error("Invalid message format");
     return;
   }
   ```

3. **Use wildcards for subscriptions** - Subscribe to multiple messages efficiently:
   ```typescript
   // All variables from a project
   const sub = nc.subscribe("plc.data.project1.>");

   // All field sensor readings
   const sub = nc.subscribe("field.sensor.>");
   ```

4. **Include timestamps** - All messages should have timestamps for ordering and debugging:
   ```typescript
   const message: PlcDataMessage = {
     // ...
     timestamp: Date.now(),
   };
   ```

5. **Validate before publishing** - Ensure data conforms to schema:
   ```typescript
   if (!isPlcDataMessage(message)) {
     throw new Error("Invalid message structure");
   }
   await nc.publish(subject, JSON.stringify(message));
   ```

## Extending the Schema

To add new message types:

1. Add type definition to `src/types.ts`
2. Add topic pattern to `src/topics.ts`
3. Add validator to `src/validate.ts`
4. Export from `src/mod.ts`
5. Document in this README

## Version History

- **1.0.0** - Initial schema definition
  - PLC topics and messages
  - Field device topics and messages
  - Communication and alerting
  - System health topics
  - KV bucket schemas
