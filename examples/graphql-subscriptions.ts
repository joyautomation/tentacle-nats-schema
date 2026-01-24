/**
 * Example: Using @tentacle/nats-schema with GraphQL subscriptions
 *
 * This shows how the GraphQL service can subscribe to PLC data
 * and push updates to connected clients
 */

import { connect, type NatsConnection } from "@nats-io/transport-deno";
import {
  NATS_TOPICS,
  substituteTopic,
  type PlcDataMessage,
  isPlcDataMessage,
} from "@tentacle/nats-schema";

/**
 * GraphQL subscription manager that bridges NATS and GraphQL
 */
export type GraphQLSubscriptionManager = {
  onVariableUpdate: (
    callback: (projectId: string, variableId: string, value: unknown) => void,
  ) => void;
  subscribeToProject: (projectId: string) => Promise<void>;
  disconnect: () => Promise<void>;
};

export function createGraphQLSubscriptionManager(
  nc: NatsConnection,
): GraphQLSubscriptionManager {
  const callbacks: Array<
    (projectId: string, variableId: string, value: unknown) => void
  > = [];

  return {
    /**
     * Register a callback to be called when any variable updates
     */
    onVariableUpdate: (callback) => {
      callbacks.push(callback);
    },

    /**
     * Subscribe to all variable updates from a project
     */
    subscribeToProject: async (projectId: string) => {
      // Subscribe to all variables from project using wildcard
      const pattern = substituteTopic(NATS_TOPICS.plc.data, {
        projectId,
        variableId: ">",
      });

      const sub = nc.subscribe(pattern);

      console.log(`[GraphQL] Subscribing to ${pattern}`);

      (async () => {
        for await (const msg of sub) {
          try {
            const data = JSON.parse(msg.string());

            // Validate and process
            if (isPlcDataMessage(data)) {
              // Call all registered callbacks
              for (const callback of callbacks) {
                callback(data.projectId, data.variableId, data.value);
              }

              // GraphQL would typically emit to connected clients here
              console.log(
                `[GraphQL] ${data.projectId}/${data.variableId} = ${data.value}`,
              );
            }
          } catch (error) {
            console.error(`[GraphQL] Error processing message:`, error);
          }
        }
      })();
    },

    disconnect: async () => {
      // Cleanup subscriptions
      await nc.close();
    },
  };
}

/**
 * Example: Bridging NATS to GraphQL real-time updates
 *
 * In a real GraphQL server, this would publish to subscription clients
 */
export class PlcSubscriptionResolver {
  private manager: GraphQLSubscriptionManager;

  constructor(nc: NatsConnection) {
    this.manager = createGraphQLSubscriptionManager(nc);

    // Register callback to emit to GraphQL clients
    this.manager.onVariableUpdate((projectId, variableId, value) => {
      this.emitVariableUpdate(projectId, variableId, value);
    });
  }

  /**
   * GraphQL subscription: watch a variable for changes
   */
  async *watchVariable(
    projectId: string,
    variableId: string,
  ): AsyncGenerator<{ value: unknown; timestamp: number }> {
    // Initialize subscription
    await this.manager.subscribeToProject(projectId);

    // This is simplified - in reality you'd use a pub/sub or async iterator
    // that tracks updates for THIS specific variable
    while (true) {
      // Wait for updates...
      await new Promise((resolve) => setTimeout(resolve, 100));
      // Yield updates when they arrive
    }
  }

  /**
   * GraphQL subscription: watch all variables in a project
   */
  async *watchProject(projectId: string): AsyncGenerator<{
    variable: string;
    value: unknown;
    timestamp: number;
  }> {
    await this.manager.subscribeToProject(projectId);

    // Implementation would yield project-wide updates
    while (true) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  private emitVariableUpdate(
    projectId: string,
    variableId: string,
    value: unknown,
  ) {
    // In a real GraphQL server, this would publish to clients
    // watching this variable via:
    // - PubSub.publish(`variable-${projectId}-${variableId}`, { value })
    // - Or async iterator next() calls
    console.log(
      `[GraphQL Emit] ${projectId}/${variableId} = ${value}`,
    );
  }
}

/**
 * Example usage in a GraphQL server
 */
if (import.meta.main) {
  const nc = await connect({ servers: "localhost:4222" });
  const resolver = new PlcSubscriptionResolver(nc);

  // Simulate subscription request
  console.log("Starting GraphQL subscription to project updates...");
  // const subscription = resolver.watchProject("project-1");
  // for await (const update of subscription) {
  //   console.log("GraphQL received:", update);
  // }
}
