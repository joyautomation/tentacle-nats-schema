# Integration Guide: Using @tentacle/nats-schema

This guide shows how to integrate the shared NATS schema into your Tentacle services.

## Directory Structure

```
/home/joyja/Development/
├── nats-schema/                 # Shared schema package
│   ├── deno.json
│   ├── src/
│   │   ├── mod.ts
│   │   ├── types.ts
│   │   ├── topics.ts
│   │   ├── kv-buckets.ts
│   │   └── validate.ts
│   └── examples/
├── tentacle-plc/               # PLC service
│   ├── deno.json
│   ├── nats.ts
│   └── ...
├── mqtt-handler/               # MQTT service (future)
├── graphql-handler/            # GraphQL service (future)
└── communications/             # Communications service (future)
```

## Step 1: Update tentacle-plc/deno.json

Add import mapping for the schema:

```json
{
  "name": "tentacle-plc",
  "version": "1.0.0",
  "imports": {
    "@nats-io/transport-deno": "https://esm.sh/@nats-io/transport-deno@3.0.0",
    "@tentacle/nats-schema": "file://../nats-schema/src/mod.ts",
    "jsr:@std/assert": "jsr:@std/assert@1"
  }
}
```

## Step 2: Update tentacle-plc/nats.ts

Import schema types and use them:

```typescript
import { connect, type NatsConnection } from "@nats-io/transport-deno";
import {
  type NatsConfig,
  type PlcVariable,
  type PlcVariables,
  type VariableSource,
} from "./types/variables.ts";
// Add these imports
import {
  NATS_TOPICS,
  substituteTopic,
  type PlcDataMessage,
  isPlcDataMessage,
} from "@tentacle/nats-schema";

export type NatsManager<V extends PlcVariables> = {
  connection: NatsConnection;
  subscriptions: Map<string, () => Promise<void>>;
  publish: (
    variableId: keyof V,
    value: number | boolean | string,
  ) => Promise<void>;
  disconnect: () => Promise<void>;
};

// ... rest of implementation ...

export async function setupNats<V extends PlcVariables>(
  config: NatsConfig,
  variables: V,
  projectId: string,  // Add project ID
  onVariableUpdate: (
    variableId: keyof V,
    value: number | boolean | string | Record<string, unknown>,
  ) => void,
): Promise<NatsManager<V>> {
  const nc = await connect({
    servers: config.servers,
    user: config.user,
    pass: config.pass,
    token: config.token,
  });

  const subscriptions = new Map<string, () => Promise<void>>();
  const handlers = new Map<string, SubscriptionHandler>();

  // Set up subscriptions for variables with NATS sources
  for (const [variableId, variable] of Object.entries(variables)) {
    const typedVariable = variable as PlcVariable;
    if (
      hasNatsSource(typedVariable) && typedVariable.source.subject
    ) {
      const subject = typedVariable.source.subject;
      const abort = new AbortController();

      const sub = nc.subscribe(subject);
      subscriptions.set(subject, async () => {
        abort.abort();
        await sub.unsubscribe();
      });

      // Handle incoming messages
      const handlerPromise = (async () => {
        try {
          for await (const msg of sub) {
            if (abort.signal.aborted) break;
            try {
              const value = msg.string();
              const parsedValue = parseValue(value, typedVariable.datatype);

              // Publish to schema topic
              const schemaSubject = substituteTopic(
                NATS_TOPICS.plc.data,
                {
                  projectId,
                  variableId: variableId as string,
                }
              );

              const schemaMessage: PlcDataMessage = {
                projectId,
                variableId: variableId as string,
                value: parsedValue,
                timestamp: Date.now(),
                datatype: typedVariable.datatype,
              };

              // Validate before publishing
              if (!isPlcDataMessage(schemaMessage)) {
                throw new Error("Invalid message for schema");
              }

              await nc.publish(
                schemaSubject,
                JSON.stringify(schemaMessage)
              );

              onVariableUpdate(variableId as keyof V, parsedValue);
            } catch (error) {
              console.error(
                `Error processing NATS message on subject ${subject}:`,
                error,
              );
            }
          }
        } catch (error) {
          console.error(
            `Error in subscription handler for subject ${subject}:`,
            error,
          );
        }
      })();

      handlers.set(subject, { abort, promise: handlerPromise });
    }
  }

  // ... rest of implementation ...
}
```

## Step 3: Update Initialization Code

When initializing the PLC service:

```typescript
// main.ts or your entry point
import { setupNats } from "./nats.ts";

const natsConfig = {
  servers: Deno.env.get("NATS_SERVERS")?.split(",") || "localhost:4222",
};

const projectId = Deno.env.get("PROJECT_ID") || "default-project";

const manager = await setupNats(
  natsConfig,
  variables,
  projectId,
  (variableId, value) => {
    // Handle variable updates
    console.log(`Variable ${variableId} updated to ${value}`);
  },
);
```

## Step 4: Using KV Buckets

Store variable state using the schema:

```typescript
import {
  PLCVariablesBucket,
  kvKey,
  type PlcVariableKV,
} from "@tentacle/nats-schema";

async function storeVariableState(
  manager: NatsManager,
  projectId: string,
  variableId: string,
  value: unknown,
  datatype: string,
) {
  const js = manager.connection.jetstream();
  const kv = await js.views.kv(PLCVariablesBucket.name);

  const key = kvKey(PLCVariablesBucket.keyPattern, {
    projectId,
    variableId,
  });

  const kvValue: PlcVariableKV = {
    projectId,
    variableId,
    value: value as number | boolean | string | Record<string, unknown>,
    datatype: datatype as "number" | "boolean" | "string" | "udt",
    lastUpdated: Date.now(),
    source: "plc",
    quality: "good",
  };

  await kv.put(
    key,
    new TextEncoder().encode(JSON.stringify(kvValue)),
  );
}
```

## Step 5: Validation in Message Handlers

Always validate incoming messages:

```typescript
import {
  isPlcDataMessage,
  isCommunicationEvent,
} from "@tentacle/nats-schema";

const sub = nc.subscribe("plc.data.>");
for await (const msg of sub) {
  try {
    const data = JSON.parse(msg.string());

    // Use type guard to validate
    if (isPlcDataMessage(data)) {
      // Now TypeScript knows the exact type
      console.log(`${data.projectId}/${data.variableId} = ${data.value}`);
    } else {
      console.warn("Received message with invalid schema:", data);
    }
  } catch (error) {
    console.error("Failed to parse message:", error);
  }
}
```

## For Other Services (GraphQL, MQTT, etc.)

### GraphQL Handler

```json
{
  "imports": {
    "@nats-io/transport-deno": "https://esm.sh/@nats-io/transport-deno@3.0.0",
    "@tentacle/nats-schema": "file://../nats-schema/src/mod.ts"
  }
}
```

Subscribe to PLC updates:

```typescript
import {
  NATS_SUBSCRIPTIONS,
  isPlcDataMessage,
} from "@tentacle/nats-schema";

const sub = nc.subscribe(
  NATS_SUBSCRIPTIONS.allProjectVariables(projectId)
);

for await (const msg of sub) {
  const data = JSON.parse(msg.string());
  if (isPlcDataMessage(data)) {
    // Emit to GraphQL subscribers
    pubsub.publish(`variable-${data.variableId}`, { value: data.value });
  }
}
```

### MQTT Handler

```typescript
import {
  NATS_TOPICS,
  substituteTopic,
  type MqttBridgeMessage,
} from "@tentacle/nats-schema";

// When forwarding MQTT to NATS
const message: MqttBridgeMessage = {
  originalTopic: mqttTopic,
  payload: mqttPayload,
  retained: mqttMessage.retain,
  qos: mqttMessage.qos,
  timestamp: Date.now(),
};

const subject = substituteTopic(NATS_TOPICS.mqtt.inbound, {
  topic: mqttTopic,
});

await nc.publish(subject, JSON.stringify(message));
```

## Testing with the Schema

Update your tests to use schema validators:

```typescript
import {
  isPlcDataMessage,
  parseAndValidate,
} from "@tentacle/nats-schema";

Deno.test("plc message validation", () => {
  const message = {
    projectId: "proj1",
    variableId: "temp",
    value: 25.5,
    timestamp: Date.now(),
    datatype: "number",
  };

  if (!isPlcDataMessage(message)) {
    throw new Error("Message failed schema validation");
  }
});
```

## Environment Variables

Recommended env vars for services:

```bash
# NATS Configuration
NATS_SERVERS=localhost:4222
NATS_USER=myuser
NATS_PASS=mypass

# Project Configuration
PROJECT_ID=project-1
SERVICE_NAME=plc-service

# KV Configuration
KV_RETENTION_HOURS=24
```

## Troubleshooting

### Import Errors

If you get import errors, ensure:

1. The `deno.json` import path is correct
2. You've run `deno cache --reload` to refresh imports
3. File permissions allow reading the nats-schema files

### Schema Validation Failures

If messages fail validation:

1. Check message timestamp is valid (`typeof msg.timestamp === "number"`)
2. Verify all required fields are present
3. Ensure enum values match exactly (case-sensitive)
4. Review error messages in console

### Subscription Issues

If subscriptions don't receive updates:

1. Verify topic patterns are substituted correctly
2. Check NATS server is running and accessible
3. Ensure publishers are using same topic patterns
4. Review NATS server logs for errors

## Next Steps

1. Integrate schema into tentacle-plc
2. Create MQTT handler service using schema
3. Create GraphQL handler service using schema
4. Add more message types as needed
5. Document custom extensions to the schema
