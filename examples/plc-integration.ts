/**
 * Example: Integrating @tentacle/nats-schema with tentacle-plc
 *
 * This shows how to use the shared schema in the PLC service
 */

import { connect, type NatsConnection } from "@nats-io/transport-deno";
import {
  NATS_TOPICS,
  NATS_KV_BUCKETS,
  substituteTopic,
  type PlcDataMessage,
  type PlcVariableKV,
  isPlcDataMessage,
} from "@tentacle/nats-schema";

/**
 * Extended NATS manager that uses the shared schema
 */
export type SchemaAwareNatsManager = {
  connection: NatsConnection;
  projectId: string;
  publishVariable: (variableId: string, value: unknown, datatype: string) => Promise<void>;
  storeVariableState: (
    variableId: string,
    value: unknown,
    datatype: string,
  ) => Promise<void>;
  subscribeToProjectVariables: (
    callback: (variableId: string, message: PlcDataMessage) => void,
  ) => Promise<void>;
  disconnect: () => Promise<void>;
};

/**
 * Create a schema-aware NATS manager for a PLC project
 */
export async function setupSchemaAwareNats(
  servers: string | string[],
  projectId: string,
): Promise<SchemaAwareNatsManager> {
  const nc = await connect({
    servers,
  });

  const js = nc.jetstream();

  // Ensure KV bucket exists
  try {
    await js.views.kv("plc_variables");
  } catch {
    await js.views.kv("plc_variables", {
      history: 5,
      ttl: 0,
    });
  }

  return {
    connection: nc,
    projectId,

    /**
     * Publish a variable change following the schema
     */
    publishVariable: async (variableId: string, value: unknown, datatype: string) => {
      const subject = substituteTopic(NATS_TOPICS.plc.data, {
        projectId,
        variableId,
      });

      const message: PlcDataMessage = {
        projectId,
        variableId,
        value: value as number | boolean | string | Record<string, unknown>,
        timestamp: Date.now(),
        datatype: datatype as "number" | "boolean" | "string" | "udt",
      };

      // Validate before publishing (important for data integrity)
      if (!isPlcDataMessage(message)) {
        throw new Error(`Invalid PLC data message: ${JSON.stringify(message)}`);
      }

      await nc.publish(subject, JSON.stringify(message));
    },

    /**
     * Store current variable state in KV for later retrieval
     */
    storeVariableState: async (
      variableId: string,
      value: unknown,
      datatype: string,
    ) => {
      const kv = await js.views.kv("plc_variables");

      const kvKey = `${projectId}:${variableId}`;
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
        kvKey,
        new TextEncoder().encode(JSON.stringify(kvValue)),
      );
    },

    /**
     * Subscribe to all variable changes in this project
     */
    subscribeToProjectVariables: async (
      callback: (variableId: string, message: PlcDataMessage) => void,
    ) => {
      // Use wildcard to subscribe to all variables in project
      const subject = NATS_TOPICS.plc.data
        .replace("{projectId}", projectId)
        .replace(".{variableId}", ".>");

      const sub = nc.subscribe(subject);

      (async () => {
        for await (const msg of sub) {
          try {
            const data = JSON.parse(msg.string());

            // Validate using schema validator
            if (isPlcDataMessage(data)) {
              callback(data.variableId, data);
            } else {
              console.warn(
                `Invalid PLC message received on ${msg.subject}:`,
                data,
              );
            }
          } catch (error) {
            console.error(
              `Error processing PLC message on ${msg.subject}:`,
              error,
            );
          }
        }
      })();
    },

    disconnect: async () => {
      await nc.close();
    },
  };
}

/**
 * Example usage
 */
if (import.meta.main) {
  const manager = await setupSchemaAwareNats("localhost:4222", "project-1");

  // Subscribe to variable changes
  await manager.subscribeToProjectVariables((variableId, message) => {
    console.log(
      `[${new Date(message.timestamp).toISOString()}] ${variableId} = ${message.value}`,
    );
  });

  // Simulate publishing variable changes
  setInterval(async () => {
    const temperature = Math.random() * 30 + 15;
    await manager.publishVariable("temperature", temperature, "number");
    await manager.storeVariableState("temperature", temperature, "number");
  }, 5000);

  // Graceful shutdown
  globalThis.addEventListener("unload", async () => {
    await manager.disconnect();
  });
}
